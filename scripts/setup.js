#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');

async function postInstallSetup() {
  console.log('🔧 Setting up MistralDocAI MCP Server...');
  
  try {
    const packageRoot = path.join(__dirname, '..');
    const pythonDir = path.join(packageRoot, 'python');
    
    // Ensure python directory exists
    await fs.ensureDir(pythonDir);
    
    // Copy .env.example if it doesn't exist
    const envFile = path.join(pythonDir, '.env');
    const envExample = path.join(pythonDir, '.env.example');
    
    if (!await fs.pathExists(envFile) && await fs.pathExists(envExample)) {
      await fs.copy(envExample, envFile);
      console.log('📝 Created .env file from template');
    }
    
    console.log('✅ Setup complete!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Get your Mistral API key from https://console.mistral.ai/');
    console.log('2. Edit python/.env and add your MISTRAL_API_KEY');
    console.log('3. Test the server: npx @mistraldocai/mcp-server --test');
    console.log('4. Run the server: npx @mistraldocai/mcp-server');
    console.log('');
    console.log('📖 For full documentation, see: README.md');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  postInstallSetup();
}

module.exports = postInstallSetup;