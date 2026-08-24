import { spawn } from 'child_process';
import { join } from 'path';
import { homedir } from 'os';
import fs from 'fs-extra';
import which from 'which';

/**
 * Everything the server needs from the local Python installation.
 *
 * The server depends on this interface rather than on `child_process` so that
 * tests can exercise the start-up logic without creating a virtual environment
 * or reaching the network.
 */
export interface PythonEnvironment {
  /** Create the virtual environment and install requirements when missing. */
  ensureDependencies(): Promise<void>;
  /** Seed the user's `.env` from the shipped template when missing. */
  ensureEnvFile(): Promise<void>;
  /** Import the Python MCP server to prove the environment is usable. */
  runSetupTest(): Promise<void>;
  /** Interpreter that runs the Python MCP server. */
  interpreterPath(): string;
  /** Entry point of the Python MCP server. */
  serverScriptPath(): string;
  /** Working directory the Python MCP server expects. */
  workingDirectory(): string;
}

const MINIMUM_PYTHON_MAJOR = 3;
const MINIMUM_PYTHON_MINOR = 8;

/**
 * Default implementation backed by the real filesystem and a real interpreter.
 */
export class LocalPythonEnvironment implements PythonEnvironment {
  private pythonPath: string | null = null;
  private readonly pythonDir: string;
  private readonly userDataDir: string;
  private readonly venvDir: string;

  constructor(packageRoot: string, userDataDir?: string) {
    this.pythonDir = join(packageRoot, 'python');
    // The package is usually installed globally, so state belongs to the user,
    // not to the read-only package directory.
    this.userDataDir = userDataDir ?? join(homedir(), '.mistraldocai-mcp');
    this.venvDir = join(this.userDataDir, 'venv');
  }

  public interpreterPath(): string {
    return process.platform === 'win32'
      ? join(this.venvDir, 'Scripts', 'python')
      : join(this.venvDir, 'bin', 'python');
  }

  public serverScriptPath(): string {
    return join(this.pythonDir, 'mcp_server.py');
  }

  public workingDirectory(): string {
    return this.pythonDir;
  }

  public async ensureDependencies(): Promise<void> {
    await fs.ensureDir(this.userDataDir);

    if (!(await fs.pathExists(this.venvDir))) {
      console.error('Setting up Python virtual environment...');
      await this.createVirtualEnvironment();
    }

    const installed = await this.runPipFreeze();
    if (!installed.includes('mcp>=')) {
      console.error('Installing Python dependencies...');
      await this.installDependencies();
    }
  }

  public async ensureEnvFile(): Promise<void> {
    const envFile = join(this.userDataDir, '.env');
    const envExample = join(this.pythonDir, '.env.example');

    if (!(await fs.pathExists(envFile)) && (await fs.pathExists(envExample))) {
      console.error('Creating .env file from template...');
      await fs.copy(envExample, envFile);
      console.error(`Warning: edit ${envFile} and add your MISTRAL_API_KEY`);
    }
  }

  public async runSetupTest(): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = spawn(
        this.interpreterPath(),
        ['-c', 'from mcp_server import app; print("+ MCP server ready")'],
        { cwd: this.pythonDir, stdio: 'inherit' }
      );

      proc.on('error', reject);
      proc.on('close', (code) => {
        if (code === 0) {
          console.error('+ Test passed - MCP server is ready');
          resolve();
        } else {
          console.error('X Test failed - Check your setup');
          reject(new Error(`MCP server setup test failed (exit code ${code})`));
        }
      });
    });
  }

  private async findPython(): Promise<string> {
    if (this.pythonPath) {
      return this.pythonPath;
    }

    for (const candidate of ['python3', 'python']) {
      try {
        const path = await which(candidate);
        if (isSupportedPythonVersion(await getPythonVersion(path))) {
          this.pythonPath = path;
          return path;
        }
      } catch {
        // Try the next candidate.
      }
    }

    throw new Error(
      `Python ${MINIMUM_PYTHON_MAJOR}.${MINIMUM_PYTHON_MINOR}+ is required but not found. ` +
        `Please install Python ${MINIMUM_PYTHON_MAJOR}.${MINIMUM_PYTHON_MINOR} or later.`
    );
  }

  private async createVirtualEnvironment(): Promise<void> {
    const python = await this.findPython();

    return new Promise((resolve, reject) => {
      const proc = spawn(python, ['-m', 'venv', this.venvDir], { stdio: 'inherit' });

      proc.on('error', reject);
      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Failed to create virtual environment (exit code ${code})`));
        }
      });
    });
  }

  private async installDependencies(): Promise<void> {
    const requirementsFile = join(this.pythonDir, 'mcp_requirements.txt');

    return new Promise((resolve, reject) => {
      const proc = spawn(this.pipPath(), ['install', '-r', requirementsFile], {
        stdio: ['inherit', 'ignore', 'inherit']
      });

      proc.on('error', reject);
      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Failed to install dependencies (exit code ${code})`));
        }
      });
    });
  }

  private async runPipFreeze(): Promise<string> {
    return new Promise((resolve) => {
      const proc = spawn(this.pipPath(), ['freeze']);
      let output = '';

      proc.stdout.on('data', (data) => {
        output += data.toString();
      });

      proc.on('error', () => resolve(''));
      proc.on('close', () => resolve(output));
    });
  }

  private pipPath(): string {
    return process.platform === 'win32'
      ? join(this.venvDir, 'Scripts', 'pip')
      : join(this.venvDir, 'bin', 'pip');
  }
}

export function isSupportedPythonVersion(versionString: string): boolean {
  const match = versionString.match(/Python (\d+)\.(\d+)/);
  if (!match) return false;

  const major = parseInt(match[1], 10);
  const minor = parseInt(match[2], 10);

  return (
    major > MINIMUM_PYTHON_MAJOR ||
    (major === MINIMUM_PYTHON_MAJOR && minor >= MINIMUM_PYTHON_MINOR)
  );
}

function getPythonVersion(pythonPath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn(pythonPath, ['--version']);
    let output = '';

    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.stderr.on('data', (data) => {
      output += data.toString();
    });

    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) {
        resolve(output.trim());
      } else {
        reject(new Error(`Failed to get Python version: ${output}`));
      }
    });
  });
}
