// electron/main.js
/**
 * Vibe Code Desktop - Main Process
 * Electron main process for desktop application
 */

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const isDev = require('electron-is-dev');
const Store = require('electron-store');

// Initialize electron store for user preferences
const store = new Store();

let mainWindow = null;
let splashWindow = null;

// Configure auto-updater
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

/**
 * Create splash screen window
 */
function createSplashScreen() {
  splashWindow = new BrowserWindow({
    width: 600,
    height: 400,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    center: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));

  splashWindow.on('closed', () => {
    splashWindow = null;
  });
}

/**
 * Create main application window
 */
function createMainWindow() {
  // Get window bounds from store or use defaults
  const defaultBounds = { width: 1400, height: 900 };
  const bounds = store.get('windowBounds', defaultBounds);

  mainWindow = new BrowserWindow({
    ...bounds,
    minWidth: 1200,
    minHeight: 800,
    show: false, // Don't show until ready
    backgroundColor: '#0a0a0a',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      devTools: isDev,
    },
    titleBarStyle: 'hiddenInset', // Modern look
    trafficLightPosition: { x: 20, y: 20 }, // macOS traffic lights position
  });

  // Load the app
  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../out/index.html')}`;

  mainWindow.loadURL(startUrl);

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    // Close splash screen
    if (splashWindow) {
      splashWindow.close();
    }

    // Show main window with fade-in effect
    mainWindow.show();
    mainWindow.focus();

    // Check for updates
    if (!isDev) {
      autoUpdater.checkForUpdatesAndNotify();
    }
  });

  // Save window bounds on resize/move
  mainWindow.on('close', () => {
    const bounds = mainWindow.getBounds();
    store.set('windowBounds', bounds);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Dev tools in development
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }
}

/**
 * App initialization
 */
app.whenReady().then(() => {
  // Create splash screen first
  createSplashScreen();

  // Create main window after short delay
  setTimeout(() => {
    createMainWindow();
  }, 2000);

  // macOS: Re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

/**
 * Quit when all windows are closed (except macOS)
 */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Auto-updater events
 */
autoUpdater.on('update-available', (info) => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Available',
    message: `New version ${info.version} is available!`,
    detail: 'Do you want to download it now?',
    buttons: ['Download', 'Later'],
    defaultId: 0,
    cancelId: 1,
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.downloadUpdate();
    }
  });
});

autoUpdater.on('update-downloaded', (info) => {
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Update Ready',
    message: `Version ${info.version} has been downloaded.`,
    detail: 'Restart now to install the update?',
    buttons: ['Restart', 'Later'],
    defaultId: 0,
    cancelId: 1,
  }).then((result) => {
    if (result.response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
});

autoUpdater.on('error', (error) => {
  console.error('Update error:', error);
});

/**
 * IPC Handlers
 */

// Get app version
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

// Get user preferences
ipcMain.handle('get-preferences', () => {
  return store.store;
});

// Set user preference
ipcMain.handle('set-preference', (event, key, value) => {
  store.set(key, value);
  return true;
});

// Check for updates manually
ipcMain.handle('check-for-updates', async () => {
  if (!isDev) {
    return await autoUpdater.checkForUpdates();
  }
  return null;
});

// Show open dialog
ipcMain.handle('show-open-dialog', async (event, options) => {
  return await dialog.showOpenDialog(mainWindow, options);
});

// Show save dialog
ipcMain.handle('show-save-dialog', async (event, options) => {
  return await dialog.showSaveDialog(mainWindow, options);
});

// Minimize window
ipcMain.on('minimize-window', () => {
  mainWindow.minimize();
});

// Maximize/unmaximize window
ipcMain.on('toggle-maximize', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

// Close window
ipcMain.on('close-window', () => {
  mainWindow.close();
});

// Restart app
ipcMain.on('restart-app', () => {
  app.relaunch();
  app.quit();
});

// Show notification
ipcMain.handle('show-notification', (event, title, body) => {
  const { Notification } = require('electron');

  if (Notification.isSupported()) {
    new Notification({
      title,
      body,
      icon: path.join(__dirname, 'assets', 'icon.png'),
    }).show();
  }
});

/**
 * Security: Disable navigation to external sites
 */
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl);

    // Only allow localhost in dev mode
    if (isDev && parsedUrl.origin === 'http://localhost:3000') {
      return;
    }

    // Block all other navigation
    event.preventDefault();
  });
});

/**
 * Log app information
 */
console.log('Vibe Code Desktop');
console.log(`Version: ${app.getVersion()}`);
console.log(`Electron: ${process.versions.electron}`);
console.log(`Node: ${process.versions.node}`);
console.log(`Platform: ${process.platform}`);
console.log(`Dev mode: ${isDev}`);
