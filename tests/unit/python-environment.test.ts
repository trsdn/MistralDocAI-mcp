import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { EventEmitter } from 'events';
import { mkdtemp, remove, ensureDir, outputFile, pathExists, readFile } from 'fs-extra';
import { tmpdir } from 'os';
import { join } from 'path';

jest.mock('child_process');

import { spawn } from 'child_process';
import { LocalPythonEnvironment } from '../../src/python-environment';

type Outcome = { stdout?: string; stderr?: string; code?: number; error?: Error };

class FakeChildProcess extends EventEmitter {
  public readonly stdout = new EventEmitter();
  public readonly stderr = new EventEmitter();
}

const spawnMock = spawn as unknown as jest.Mock<
  (command: string, args?: string[], options?: unknown) => FakeChildProcess
>;

/** Drives `spawn` through a scripted sequence of child-process outcomes. */
function scriptSpawn(outcomes: Outcome[]): Array<{ command: string; args: string[] }> {
  const calls: Array<{ command: string; args: string[] }> = [];

  spawnMock.mockImplementation((command, args) => {
    calls.push({ command: String(command), args: args ?? [] });

    const outcome = outcomes.shift() ?? { code: 0 };
    const child = new FakeChildProcess();

    setImmediate(() => {
      if (outcome.error) {
        child.emit('error', outcome.error);
        return;
      }
      if (outcome.stdout) child.stdout.emit('data', Buffer.from(outcome.stdout));
      if (outcome.stderr) child.stderr.emit('data', Buffer.from(outcome.stderr));
      child.emit('close', outcome.code ?? 0);
    });

    return child;
  });

  return calls;
}

describe('LocalPythonEnvironment', () => {
  let packageRoot: string;
  let userDataDir: string;
  let environment: LocalPythonEnvironment;

  beforeEach(async () => {
    packageRoot = await mkdtemp(join(tmpdir(), 'mistraldocai-pkg-'));
    userDataDir = await mkdtemp(join(tmpdir(), 'mistraldocai-home-'));
    environment = new LocalPythonEnvironment(packageRoot, userDataDir);

    spawnMock.mockReset();
  });

  afterEach(async () => {
    await remove(packageRoot);
    await remove(userDataDir);
  });

  describe('Paths', () => {
    it('resolves the interpreter inside the managed virtual environment', () => {
      expect(environment.interpreterPath().startsWith(join(userDataDir, 'venv'))).toBe(true);
    });

    it('runs the Python server from the packaged python directory', () => {
      expect(environment.serverScriptPath()).toBe(join(packageRoot, 'python', 'mcp_server.py'));
      expect(environment.workingDirectory()).toBe(join(packageRoot, 'python'));
    });
  });

  describe('ensureEnvFile', () => {
    it('seeds the user .env from the shipped template', async () => {
      await outputFile(join(packageRoot, 'python', '.env.example'), 'MISTRAL_API_KEY=\n');

      await environment.ensureEnvFile();

      expect(await readFile(join(userDataDir, '.env'), 'utf8')).toBe('MISTRAL_API_KEY=\n');
    });

    it('never overwrites an existing .env', async () => {
      await outputFile(join(packageRoot, 'python', '.env.example'), 'MISTRAL_API_KEY=\n');
      await outputFile(join(userDataDir, '.env'), 'MISTRAL_API_KEY=already-configured\n');

      await environment.ensureEnvFile();

      expect(await readFile(join(userDataDir, '.env'), 'utf8')).toBe(
        'MISTRAL_API_KEY=already-configured\n'
      );
    });

    it('does nothing when the package ships no template', async () => {
      await environment.ensureEnvFile();

      expect(await pathExists(join(userDataDir, '.env'))).toBe(false);
    });
  });

  describe('runSetupTest', () => {
    it('resolves when the Python server imports cleanly', async () => {
      const calls = scriptSpawn([{ code: 0 }]);

      await expect(environment.runSetupTest()).resolves.toBeUndefined();
      expect(calls[0].args[0]).toBe('-c');
    });

    it('rejects with the exit code when the import fails', async () => {
      scriptSpawn([{ code: 2 }]);

      await expect(environment.runSetupTest()).rejects.toThrow(
        'MCP server setup test failed (exit code 2)'
      );
    });

    it('rejects when the interpreter cannot be spawned at all', async () => {
      scriptSpawn([{ error: new Error('spawn ENOENT') }]);

      await expect(environment.runSetupTest()).rejects.toThrow('spawn ENOENT');
    });
  });

  describe('ensureDependencies', () => {
    it('creates the virtual environment and installs requirements when missing', async () => {
      const calls = scriptSpawn([
        { stdout: 'Python 3.12.1\n', code: 0 }, // version probe
        { code: 0 }, // python -m venv
        { stdout: '', code: 0 }, // pip freeze
        { code: 0 } // pip install
      ]);

      await environment.ensureDependencies();

      expect(calls.map((call) => call.args[0])).toEqual(['--version', '-m', 'freeze', 'install']);
      expect(calls[3].args).toContain(join(packageRoot, 'python', 'mcp_requirements.txt'));
    });

    it('skips installation when requirements are already present', async () => {
      await ensureDir(join(userDataDir, 'venv'));
      const calls = scriptSpawn([{ stdout: 'mcp==2.0.0\nmistralai==2.9.3\n', code: 0 }]);

      await environment.ensureDependencies();

      expect(calls).toHaveLength(1);
      expect(calls[0].args).toEqual(['freeze']);
    });

    it('reports a failed virtual environment creation', async () => {
      scriptSpawn([{ stdout: 'Python 3.12.1\n', code: 0 }, { code: 1 }]);

      await expect(environment.ensureDependencies()).rejects.toThrow(
        'Failed to create virtual environment (exit code 1)'
      );
    });

    it('reports a failed dependency installation', async () => {
      await ensureDir(join(userDataDir, 'venv'));
      scriptSpawn([{ stdout: '', code: 0 }, { code: 1 }]);

      await expect(environment.ensureDependencies()).rejects.toThrow(
        'Failed to install dependencies (exit code 1)'
      );
    });

    it('refuses to continue when the interpreter is too old', async () => {
      scriptSpawn([
        { stdout: 'Python 3.7.9\n', code: 0 }, // python3
        { stdout: 'Python 2.7.18\n', code: 0 } // python
      ]);

      await expect(environment.ensureDependencies()).rejects.toThrow(
        'Python 3.8+ is required but not found'
      );
    });

    it('refuses to continue when no interpreter is on PATH', async () => {
      scriptSpawn([
        { error: new Error('spawn python3 ENOENT') },
        { error: new Error('spawn python ENOENT') }
      ]);

      await expect(environment.ensureDependencies()).rejects.toThrow(
        'Python 3.8+ is required but not found'
      );
    });

    it('falls back to `python` when `python3` is unavailable', async () => {
      const calls = scriptSpawn([
        { error: new Error('spawn python3 ENOENT') },
        { stdout: 'Python 3.12.1\n', code: 0 }, // python
        { code: 0 }, // python -m venv
        { stdout: '', code: 0 }, // pip freeze
        { code: 0 } // pip install
      ]);

      await environment.ensureDependencies();

      expect(calls[1].command).toBe('python');
      expect(calls[2].command).toBe('python');
    });
  });
});
