const { app, BrowserWindow, Menu, dialog } = require('electron');
const locales = require('./locales');
const fs = require('fs');
const path = require('path');

const currentLocale = 'zh';

app.setName('Lottie tools');
app.setVersion('0.0.1');

const configPath = path.join(__dirname, 'config.json');
let config = {
  theme: 'light'
};

try {
  const configData = fs.readFileSync(configPath, 'utf8');
  config = JSON.parse(configData);
} catch (error) {
  console.error('Error reading config file:', error);
}

let currentTheme = config.theme;

function saveConfig() {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error('Error saving config file:', error);
  }
}

function createMenu() {
  const template = [
    {
      label: app.name,
      submenu: [
        {
          label: locales[currentLocale].menu.about,
          click: () => {
            dialog.showMessageBox({
              title: locales[currentLocale].menu.about,
              message: 'Lottie tools',
              detail: `${locales[currentLocale].menu.version} ${app.getVersion()}\n${locales[currentLocale].menu.aboutDetail}`,
              buttons: [locales[currentLocale].menu.ok],
              icon: path.join(__dirname, 'assets/icon.png')
            });
          }
        },
        { type: 'separator' },
        {
          label: locales[currentLocale].menu.settings,
          submenu: [
            {
              label: locales[currentLocale].menu.theme,
              submenu: [
                {
                  label: locales[currentLocale].menu.lightMode,
                  type: 'radio',
                  checked: currentTheme === 'light',
                  click: () => {
                    currentTheme = 'light';
                    config.theme = currentTheme;
                    saveConfig();
                    BrowserWindow.getAllWindows().forEach(win => {
                      win.webContents.send('theme-changed', 'light');
                    });
                  }
                },
                {
                  label: locales[currentLocale].menu.darkMode,
                  type: 'radio',
                  checked: currentTheme === 'dark',
                  click: () => {
                    currentTheme = 'dark';
                    config.theme = currentTheme;
                    saveConfig();
                    BrowserWindow.getAllWindows().forEach(win => {
                      win.webContents.send('theme-changed', 'dark');
                    });
                  }
                }
              ]
            },
          ]
        },
        { type: 'separator' },
        { role: 'quit', label: locales[currentLocale].menu.quit }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hiddenInset',
  });

  win.loadFile('index.html');
  win.webContents.on('did-finish-load', () => {
    win.webContents.send('theme-changed', currentTheme);
  });
}

app.whenReady().then(() => {
  createMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});