#!/usr/bin/env node

import { spawn, ChildProcess } from 'child_process';
import { join, dirname } from 'path';
import { homedir } from 'os';
import fs from 'fs-extra';
import which from 'which';

// Get current directory
const currentDir = dirname(__filename);

interface ServerOptions {
  test?: boolean;
  help?: boolean;
  version?: boolean;
}

class MistralDocAIMCPServer {
  private pythonPath: string | null = null;
  private serverProcess: ChildProcess | null = null;
  private readonly packageRoot: string;

  constructor() {
    // Get the package root directory (dist is one level down from package root)
    this.packageRoot = join(currentDir, '..');
  }

  private async findPython(): Promise<string> {
    if (this.pythonPath) {
      return this.pythonPath;
    }

    const candidates = ['python3', 'python'];
    
    for (const candidate of candidates) {
      try {
        const path = await which(candidate);
        // Verify it's Python 3.8+
        const version = await this.getPythonVersion(path);
        if (this.isValidPythonVersion(version)) {
          this.pythonPath = path;
          return path;
        }
      } catch (error) {
        // Continue to next candidate
      }
    }

    throw new Error(
      'Python 3.8+ is required but not found. Please install Python 3.8 or later.'
    );
  }

  private async getPythonVersion(pythonPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const proc = spawn(pythonPath, ['--version']);
      let output = '';
      
      proc.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      proc.stderr.on('data', (data) => {
        output += data.toString();
      });
      
      proc.on('close', (code) => {
        if (code === 0) {
          resolve(output.trim());
        } else {
          reject(new Error(`Failed to get Python version: ${output}`));
        }
      });
    });
  }

  private isValidPythonVersion(versionString: string): boolean {
    const match = versionString.match(/Python (\d+)\.(\d+)/);
    if (!match) return false;
    
    const major = parseInt(match[1]);
    const minor = parseInt(match[2]);
    
    return major > 3 || (major === 3 && minor >= 8);
  }

  private async ensurePythonDependencies(): Promise<void> {
    const pythonDir = join(this.packageRoot, 'python');
    // Use user home directory for virtual environment when package is globally installed
    const userDataDir = join(homedir(), '.mistraldocai-mcp');
    await fs.ensureDir(userDataDir);
    const venvDir = join(userDataDir, 'venv');
    const requirementsFile = join(pythonDir, 'mcp_requirements.txt');
    
    // Check if virtual environment exists
    if (!await fs.pathExists(venvDir)) {
      console.error('Setting up Python virtual environment...');
      await this.createVirtualEnvironment(pythonDir, venvDir);
    }
    
    // Check if dependencies are installed
    const pipFreeze = await this.runPipFreeze(venvDir);
    if (!pipFreeze.includes('mcp>=')) {
      console.error('Installing Python dependencies...');
      await this.installDependencies(venvDir, requirementsFile);
    }
  }

  private async createVirtualEnvironment(pythonDir: string, venvDir: string): Promise<void> {
    const python = await this.findPython();
    
    return new Promise((resolve, reject) => {
      const proc = spawn(python, ['-m', 'venv', venvDir], { 
        stdio: 'inherit' 
      });
      
      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Failed to create virtual environment (exit code ${code})`));
        }
      });
    });
  }

  private async installDependencies(venvDir: string, requirementsFile: string): Promise<void> {
    const pipPath = process.platform === 'win32' 
      ? join(venvDir, 'Scripts', 'pip')
      : join(venvDir, 'bin', 'pip');
    
    return new Promise((resolve, reject) => {
      const proc = spawn(pipPath, ['install', '-r', requirementsFile], {
        stdio: ['inherit', 'ignore', 'inherit']
      });
      
      proc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Failed to install dependencies (exit code ${code})`));
        }
      });
    });
  }

  private async runPipFreeze(venvDir: string): Promise<string> {
    const pipPath = process.platform === 'win32' 
      ? join(venvDir, 'Scripts', 'pip')
      : join(venvDir, 'bin', 'pip');
    
    return new Promise((resolve) => {
      const proc = spawn(pipPath, ['freeze']);
      let output = '';
      
      proc.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      proc.on('close', () => {
        resolve(output);
      });
    });
  }

  private async checkEnvironmentFile(): Promise<void> {
    const pythonDir = join(this.packageRoot, 'python');
    const userDataDir = join(homedir(), '.mistraldocai-mcp');
    const envFile = join(userDataDir, '.env');
    const envExample = join(pythonDir, '.env.example');
    
    if (!await fs.pathExists(envFile) && await fs.pathExists(envExample)) {
      console.error('Creating .env file from template...');
      await fs.copy(envExample, envFile);
      console.error(`⚠️  Please edit ${envFile} and add your MISTRAL_API_KEY`);
    }
  }

  public async start(options: ServerOptions = {}): Promise<void> {
    if (options.help) {
      this.showHelp();
      return;
    }
    
    if (options.version) {
      this.showVersion();
      return;
    }

    try {
      // Setup Python environment
      await this.ensurePythonDependencies();
      await this.checkEnvironmentFile();
      
      // Start the Python MCP server
      const pythonDir = join(this.packageRoot, 'python');
      const userDataDir = join(homedir(), '.mistraldocai-mcp');
      const venvDir = join(userDataDir, 'venv');
      const serverScript = join(pythonDir, 'mcp_server.py');
      
      const pythonPath = process.platform === 'win32'
        ? join(venvDir, 'Scripts', 'python')
        : join(venvDir, 'bin', 'python');
      
      if (options.test) {
        console.error('Testing MCP server setup...');
        const testProc = spawn(pythonPath, ['-c', 'from mcp_server import app; print("+ MCP server ready")'], {
          cwd: pythonDir,
          stdio: 'inherit'
        });
        
        testProc.on('close', (code) => {
          if (code === 0) {
            console.error('+ Test passed - MCP server is ready');
          } else {
            console.error('X Test failed - Check your setup');
            process.exit(1);
          }
        });
        return;
      }
      
      console.error('Starting MistralDocAI MCP Server...');
      this.serverProcess = spawn(pythonPath, [serverScript], {
        cwd: pythonDir,
        stdio: 'inherit'
      });
      
      this.serverProcess.on('close', (code) => {
        if (code !== 0) {
          console.error(`MCP server exited with code ${code}`);
          process.exit(code || 1);
        }
      });
      
      // Handle graceful shutdown
      process.on('SIGINT', () => this.shutdown());
      process.on('SIGTERM', () => this.shutdown());
      
    } catch (error) {
      console.error('Failed to start MCP server:', error);
      process.exit(1);
    }
  }

  private shutdown(): void {
    console.error('\nShutting down MCP server...');
    if (this.serverProcess) {
      this.serverProcess.kill('SIGTERM');
    }
    process.exit(0);
  }

  private showHelp(): void {
    console.log(`
MistralDocAI MCP Server

USAGE:
  npx @mistraldocai/mcp-server [OPTIONS]

OPTIONS:
  --test     Test the server setup
  --help     Show this help message
  --version  Show version information

ENVIRONMENT:
  MISTRAL_API_KEY  Your Mistral AI API key (required)

EXAMPLES:
  npx @mistraldocai/mcp-server
  npx @mistraldocai/mcp-server --test

For more information, visit: https://github.com/yourusername/MistralDocAI-mcp
`);
  }

  private showVersion(): void {
    const packageJson = require(join(this.packageRoot, 'package.json'));
    console.log(`MistralDocAI MCP Server v${packageJson.version}`);
  }
}

// Parse command line arguments
function parseArgs(): ServerOptions {
  const args = process.argv.slice(2);
  const options: ServerOptions = {};
  
  for (const arg of args) {
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

// Main execution
if (require.main === module) {
  const options = parseArgs();
  const server = new MistralDocAIMCPServer();
  server.start(options).catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
}

export default MistralDocAIMCPServer;