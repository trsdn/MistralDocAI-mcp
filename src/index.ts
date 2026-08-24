#!/usr/bin/env node

import { spawn, ChildProcess } from 'child_process';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { LocalPythonEnvironment, PythonEnvironment } from './python-environment';

const currentDir = dirname(__filename);

export interface ServerOptions {
  test?: boolean;
  help?: boolean;
  version?: boolean;
}

interface PackageIdentity {
  name: string;
  version: string;
  repository: string;
  issues: string;
  license: string;
}

class MistralDocAIMCPServer {
  private serverProcess: ChildProcess | null = null;
  private readonly packageRoot: string;
  private readonly environment: PythonEnvironment;

  constructor(environment?: PythonEnvironment) {
    // `dist/` is one level below the package root.
    this.packageRoot = join(currentDir, '..');
    this.environment = environment ?? new LocalPythonEnvironment(this.packageRoot);
  }

  public async start(options: ServerOptions = {}): Promise<void> {
    this.validateOptions(options);

    if (options.help) {
      this.showHelp();
      return;
    }

    if (options.version) {
      this.showVersion();
      return;
    }

    try {
      await this.environment.ensureDependencies();
      await this.environment.ensureEnvFile();

      if (options.test) {
        console.error('Testing MCP server setup...');
        await this.environment.runSetupTest();
        return;
      }

      console.error('Starting MistralDocAI MCP Server...');
      this.serverProcess = spawn(
        this.environment.interpreterPath(),
        [this.environment.serverScriptPath()],
        { cwd: this.environment.workingDirectory(), stdio: 'inherit' }
      );

      this.serverProcess.on('close', (code) => {
        if (code !== 0) {
          console.error(`MCP server exited with code ${code}`);
          process.exit(code || 1);
        }
      });

      process.on('SIGINT', () => this.shutdown());
      process.on('SIGTERM', () => this.shutdown());
    } catch (error) {
      console.error('Failed to start MCP server:', error);
      throw error;
    }
  }

  private validateOptions(options: ServerOptions): void {
    const allowedOptions = new Set(['test', 'help', 'version']);
    const unknownOptions = Object.keys(options).filter((option) => !allowedOptions.has(option));

    if (unknownOptions.length > 0) {
      throw new Error(`Unknown option(s): ${unknownOptions.join(', ')}`);
    }
  }

  private shutdown(): void {
    console.error('\nShutting down MCP server...');
    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM');
    }
    process.exit(0);
  }

  /**
   * Identity is read from the package manifest so that the running product
   * cannot drift from the published artifact.
   */
  private identity(): PackageIdentity {
    const manifest = JSON.parse(readFileSync(join(this.packageRoot, 'package.json'), 'utf8'));
    const repository: string = (manifest.repository?.url ?? '')
      .replace(/^git\+/, '')
      .replace(/\.git$/, '');

    return {
      name: manifest.name,
      version: manifest.version,
      repository,
      issues: manifest.bugs?.url ?? `${repository}/issues`,
      license: manifest.license
    };
  }

  private showHelp(): void {
    const { name, repository, issues } = this.identity();

    console.log(`
MistralDocAI MCP Server

USAGE:
  npx ${name} [OPTIONS]

OPTIONS:
  --test     Test the server setup
  --help     Show this help message
  --version  Show version information

ENVIRONMENT:
  MISTRAL_API_KEY  Your Mistral AI API key (required)

EXAMPLES:
  npx ${name}
  npx ${name} --test

Repository:    ${repository}
Report issues: ${issues}
`);
  }

  private showVersion(): void {
    const { name, version, repository, issues, license } = this.identity();

    console.log(`
MistralDocAI MCP Server v${version}

Package:       ${name}
License:       ${license}
Repository:    ${repository}
Report issues: ${issues}
`);
  }
}

export function parseArgs(argv: string[]): ServerOptions {
  const options: ServerOptions = {};

  for (const arg of argv) {
    switch (arg) {
      case '--test':
        options.test = true;
        break;
      case '--help':
      case '-h':
        options.help = true;
        break;
      case '--version':
      case '-v':
        options.version = true;
        break;
    }
  }

  return options;
}

if (require.main === module) {
  const server = new MistralDocAIMCPServer();
  server.start(parseArgs(process.argv.slice(2))).catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
}

export default MistralDocAIMCPServer;
