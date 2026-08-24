#!/usr/bin/env node

// npm postinstall hook. It only prints guidance.
//
// It deliberately writes no files. It used to create `python/.env` inside the
// installed package, which is read-only for global installs and which caused a
// local key to be packed into published tarballs. The server seeds
// `~/.mistraldocai-mcp/.env` at run time instead.
//
// Modern npm gates install scripts, so this may never run. Nothing here may be
// required for the package to work.

const path = require('path');

function reportNextSteps() {
  const manifest = require(path.join(__dirname, '..', 'package.json'));

  console.log(`${manifest.name} v${manifest.version} installed.`);
  console.log('');
  console.log('Next steps:');
  console.log('  1. Get a Mistral API key from https://console.mistral.ai/');
  console.log('  2. Set MISTRAL_API_KEY in your environment, or add it to');
  console.log('     ~/.mistraldocai-mcp/.env once the server has run first');
  console.log(`  3. Verify the setup: npx ${manifest.name} --test`);
  console.log('');
  console.log(`Documentation: ${manifest.homepage}`);
}

if (require.main === module) {
  try {
    reportNextSteps();
  } catch (error) {
    // A postinstall failure must never fail the install of a working package.
    console.error(`Warning: could not print setup guidance: ${error.message}`);
  }
}

module.exports = reportNextSteps;
