const path = require('node:path');
const { app, BrowserWindow } = require('electron/main');

const DEV_SERVER_URL = 'http://localhost:5173';

const createWindow = () => {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
  });

  if (app.isPackaged) {
    win.loadFile(path.join(app.getAppPath(), 'dist', 'index.html'));
  } else {
    win.loadURL(DEV_SERVER_URL);
  }
};

app.whenReady().then(() => {
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
