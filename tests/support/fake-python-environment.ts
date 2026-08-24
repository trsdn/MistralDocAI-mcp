import { PythonEnvironment } from '../../src/python-environment';

type EnvironmentCall = 'ensureDependencies' | 'ensureEnvFile' | 'runSetupTest';

/**
 * In-memory stand-in for the local Python installation.
 *
 * Unit tests use this so that starting the server never creates a virtual
 * environment, never installs packages, and never touches the network.
 */
export class FakePythonEnvironment implements PythonEnvironment {
  public readonly calls: EnvironmentCall[] = [];

  constructor(private readonly failures: Partial<Record<EnvironmentCall, Error>> = {}) {}

  public async ensureDependencies(): Promise<void> {
    this.record('ensureDependencies');
  }

  public async ensureEnvFile(): Promise<void> {
    this.record('ensureEnvFile');
  }

  public async runSetupTest(): Promise<void> {
    this.record('runSetupTest');
  }

  public interpreterPath(): string {
    return '/fake/venv/bin/python';
  }

  public serverScriptPath(): string {
    return '/fake/package/python/mcp_server.py';
  }

  public workingDirectory(): string {
    return '/fake/package/python';
  }

  private record(call: EnvironmentCall): void {
    this.calls.push(call);
    const failure = this.failures[call];
    if (failure) {
      throw failure;
    }
  }
}
