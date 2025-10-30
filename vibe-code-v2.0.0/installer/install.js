#!/usr/bin/env node
// installer/install.js
/**
 * Vibe Code - Smart Installer
 * Automatically downloads and installs all dependencies
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

// Print with style
function print(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function printBanner() {
  print('\n╔══════════════════════════════════════════════════════╗', 'cyan');
  print('║                                                      ║', 'cyan');
  print('║              🚀 VIBE CODE INSTALLER 🚀              ║', 'bright');
  print('║                                                      ║', 'cyan');
  print('║         AI-Powered Code Generation Platform         ║', 'cyan');
  print('║                                                      ║', 'cyan');
  print('╚══════════════════════════════════════════════════════╝', 'cyan');
  print('', 'reset');
}

function printStep(step, message) {
  print(`\n[${step}/6] ${message}`, 'blue');
}

function printSuccess(message) {
  print(`✅ ${message}`, 'green');
}

function printError(message) {
  print(`❌ ${message}`, 'red');
}

function printWarning(message) {
  print(`⚠️  ${message}`, 'yellow');
}

/**
 * Check if Node.js is installed
 */
function checkNode() {
  return new Promise((resolve) => {
    exec('node --version', (error, stdout) => {
      if (error) {
        resolve({ installed: false, version: null });
      } else {
        const version = stdout.trim();
        const majorVersion = parseInt(version.split('.')[0].slice(1));
        resolve({
          installed: true,
          version,
          valid: majorVersion >= 18,
        });
      }
    });
  });
}

/**
 * Download Node.js installer
 */
function downloadNode() {
  return new Promise((resolve, reject) => {
    printStep(2, 'Downloading Node.js...');

    const platform = os.platform();
    const arch = os.arch();

    let downloadUrl;
    let fileName;

    // Determine download URL based on platform
    if (platform === 'win32') {
      fileName = arch === 'x64' ? 'node-v20.11.0-x64.msi' : 'node-v20.11.0-x86.msi';
      downloadUrl = `https://nodejs.org/dist/v20.11.0/${fileName}`;
    } else if (platform === 'darwin') {
      fileName = 'node-v20.11.0.pkg';
      downloadUrl = `https://nodejs.org/dist/v20.11.0/${fileName}`;
    } else {
      printError('Automatic Node.js installation not supported on this platform.');
      printWarning('Please install Node.js 20+ manually from https://nodejs.org/');
      process.exit(1);
    }

    const downloadPath = path.join(os.tmpdir(), fileName);
    const file = fs.createWriteStream(downloadPath);

    https.get(downloadUrl, (response) => {
      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloadedSize = 0;

      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        const percent = ((downloadedSize / totalSize) * 100).toFixed(1);
        process.stdout.write(`\r   Downloading: ${percent}% `);
      });

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        print('\n');
        printSuccess('Node.js downloaded successfully!');
        resolve(downloadPath);
      });
    }).on('error', (error) => {
      fs.unlink(downloadPath, () => {});
      printError(`Download failed: ${error.message}`);
      reject(error);
    });
  });
}

/**
 * Install Node.js
 */
function installNode(installerPath) {
  return new Promise((resolve, reject) => {
    printStep(3, 'Installing Node.js...');
    print('   This may require administrator privileges.\n', 'yellow');

    const platform = os.platform();
    let command;

    if (platform === 'win32') {
      command = `msiexec /i "${installerPath}" /qn`;
    } else if (platform === 'darwin') {
      command = `sudo installer -pkg "${installerPath}" -target /`;
    }

    exec(command, (error) => {
      if (error) {
        printError(`Installation failed: ${error.message}`);
        reject(error);
      } else {
        printSuccess('Node.js installed successfully!');
        resolve();
      }
    });
  });
}

/**
 * Install npm dependencies
 */
function installDependencies() {
  return new Promise((resolve, reject) => {
    printStep(4, 'Installing dependencies...');
    print('   This may take a few minutes...\n', 'yellow');

    exec('npm install', { cwd: __dirname }, (error, stdout, stderr) => {
      if (error) {
        printError(`Dependency installation failed: ${error.message}`);
        reject(error);
      } else {
        printSuccess('Dependencies installed successfully!');
        resolve();
      }
    });
  });
}

/**
 * Build the application
 */
function buildApp() {
  return new Promise((resolve, reject) => {
    printStep(5, 'Building application...');
    print('   Optimizing for production...\n', 'yellow');

    exec('npm run build', { cwd: __dirname }, (error) => {
      if (error) {
        printError(`Build failed: ${error.message}`);
        reject(error);
      } else {
        printSuccess('Application built successfully!');
        resolve();
      }
    });
  });
}

/**
 * Create desktop shortcut (Windows only)
 */
function createShortcut() {
  return new Promise((resolve) => {
    if (os.platform() !== 'win32') {
      resolve();
      return;
    }

    printStep(6, 'Creating desktop shortcut...');

    const shell = require('child_process');
    const desktopPath = path.join(os.homedir(), 'Desktop');
    const shortcutPath = path.join(desktopPath, 'Vibe Code.lnk');

    // PowerShell script to create shortcut
    const script = `
      $WshShell = New-Object -comObject WScript.Shell
      $Shortcut = $WshShell.CreateShortcut('${shortcutPath}')
      $Shortcut.TargetPath = 'npm'
      $Shortcut.Arguments = 'start'
      $Shortcut.WorkingDirectory = '${__dirname}'
      $Shortcut.IconLocation = '${path.join(__dirname, 'electron', 'assets', 'icon.ico')}'
      $Shortcut.Save()
    `;

    shell.exec(`powershell -Command "${script}"`, (error) => {
      if (error) {
        printWarning('Could not create desktop shortcut.');
      } else {
        printSuccess('Desktop shortcut created!');
      }
      resolve();
    });
  });
}

/**
 * Main installation process
 */
async function install() {
  try {
    printBanner();

    // Step 1: Check Node.js
    printStep(1, 'Checking Node.js installation...');
    const nodeStatus = await checkNode();

    if (!nodeStatus.installed) {
      printWarning('Node.js not found.');
      const answer = await prompt('Would you like to install Node.js automatically? (y/n) ');

      if (answer.toLowerCase() === 'y') {
        const installerPath = await downloadNode();
        await installNode(installerPath);

        // Verify installation
        const newNodeStatus = await checkNode();
        if (!newNodeStatus.installed) {
          printError('Node.js installation failed. Please install manually.');
          process.exit(1);
        }
      } else {
        printError('Node.js is required. Please install from https://nodejs.org/');
        process.exit(1);
      }
    } else if (!nodeStatus.valid) {
      printWarning(`Node.js ${nodeStatus.version} is installed, but v18+ is required.`);
      printError('Please update Node.js from https://nodejs.org/');
      process.exit(1);
    } else {
      printSuccess(`Node.js ${nodeStatus.version} detected.`);
    }

    // Step 4: Install dependencies
    await installDependencies();

    // Step 5: Build app
    await buildApp();

    // Step 6: Create shortcut
    await createShortcut();

    // Success!
    print('\n╔══════════════════════════════════════════════════════╗', 'green');
    print('║                                                      ║', 'green');
    print('║         🎉 INSTALLATION COMPLETE! 🎉                ║', 'bright');
    print('║                                                      ║', 'green');
    print('╚══════════════════════════════════════════════════════╝', 'green');

    print('\n📖 Quick Start:', 'cyan');
    print('   1. Run: npm start', 'reset');
    print('   2. Open: http://localhost:3000', 'reset');
    print('   3. Configure your API keys in .env file\n', 'reset');

    print('📚 Documentation:', 'cyan');
    print('   README.md - Getting started guide', 'reset');
    print('   HOW_TO_USE.md - Complete user guide', 'reset');
    print('   DEPLOYMENT_GUIDE.md - Deployment instructions\n', 'reset');

    print('💬 Support:', 'cyan');
    print('   GitHub: https://github.com/your-org/vibe-code', 'reset');
    print('   Discord: Join our community\n', 'reset');

  } catch (error) {
    printError(`Installation failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Simple prompt helper
 */
function prompt(question) {
  return new Promise((resolve) => {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    readline.question(question, (answer) => {
      readline.close();
      resolve(answer);
    });
  });
}

// Run installer
if (require.main === module) {
  install();
}

module.exports = { install };
