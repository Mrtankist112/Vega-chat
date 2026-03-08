const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const log = require('electron-log');

// Настройка логирования
log.transports.file.level = 'info';
autoUpdater.logger = log;

let mainWindow;
let updateInProgress = false;

// Настройка автообновления
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    transparent: true,
    backgroundColor: '#0a0f1a',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('index.html');
  mainWindow.setMovable(true);
  
  // Проверка обновлений при запуске
  setTimeout(() => {
    autoUpdater.checkForUpdates();
  }, 3000);
  
  mainWindow.on('closed', () => mainWindow = null);
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Обработка запросов к агенту
ipcMain.handle('send-to-agent', async (event, data) => {
  try {
    const requestData = JSON.parse(data);
    
    if (requestData.command === 'ping') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), requestData.timeout || 2000);
        
        const response = await fetch(`${requestData.agentUrl}/ping`, {
          method: 'GET',
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          return JSON.stringify({ 
            status: 'ok', 
            online: true,
            agentName: 'V.E.G.A'
          });
        } else {
          return JSON.stringify({ 
            status: 'error', 
            online: false
          });
        }
      } catch (error) {
        return JSON.stringify({ 
          status: 'error', 
          online: false
        });
      }
    }
    
    if (requestData.command === 'process_message') {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), requestData.timeout || 5000);
        
        const response = await fetch(`${requestData.agentUrl}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: requestData.message
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const agentResponse = await response.json();
          return JSON.stringify(agentResponse);
        } else {
          return JSON.stringify({ 
            error: true,
            status: false
          });
        }
      } catch (error) {
        return JSON.stringify({ 
          error: true,
          status: false
        });
      }
    }
    
    return JSON.stringify({ 
      error: true,
      status: false
    });
    
  } catch (error) {
    return JSON.stringify({ 
      error: true,
      status: false
    });
  }
});

// События автообновления
autoUpdater.on('checking-for-update', () => {
  log.info('Проверка обновлений...');
  if (mainWindow) {
    mainWindow.webContents.send('update-status', {
      status: 'checking',
      message: 'Проверка обновлений...'
    });
  }
});

autoUpdater.on('update-available', (info) => {
  log.info('Доступно обновление:', info);
  
  if (mainWindow) {
    mainWindow.webContents.send('update-status', {
      status: 'available',
      message: `Доступна новая версия ${info.version}`,
      version: info.version,
      releaseDate: info.releaseDate
    });
  }
  
  // Спрашиваем пользователя
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Доступно обновление',
    message: `Доступна новая версия ${info.version}`,
    detail: 'Хотите скачать обновление сейчас?',
    buttons: ['Скачать', 'Позже'],
    defaultId: 0,
    cancelId: 1
  }).then(({ response }) => {
    if (response === 0) {
      autoUpdater.downloadUpdate();
    }
  });
});

autoUpdater.on('update-not-available', (info) => {
  log.info('Обновлений нет');
  if (mainWindow) {
    mainWindow.webContents.send('update-status', {
      status: 'not-available',
      message: 'У вас актуальная версия'
    });
  }
});

autoUpdater.on('error', (err) => {
  log.error('Ошибка обновления:', err);
  if (mainWindow) {
    mainWindow.webContents.send('update-status', {
      status: 'error',
      message: 'Ошибка проверки обновлений'
    });
  }
});

autoUpdater.on('download-progress', (progressObj) => {
  let logMessage = `Скорость: ${progressObj.bytesPerSecond}`;
  logMessage += ` - Скачано ${progressObj.percent}%`;
  logMessage += ` (${progressObj.transferred}/${progressObj.total})`;
  log.info(logMessage);
  
  if (mainWindow) {
    mainWindow.webContents.send('update-progress', {
      percent: progressObj.percent,
      bytesPerSecond: progressObj.bytesPerSecond,
      transferred: progressObj.transferred,
      total: progressObj.total
    });
  }
});

autoUpdater.on('update-downloaded', (info) => {
  log.info('Обновление скачано:', info);
  
  if (mainWindow) {
    mainWindow.webContents.send('update-status', {
      status: 'downloaded',
      message: 'Обновление скачано. Установить сейчас?',
      version: info.version
    });
  }
  
  dialog.showMessageBox(mainWindow, {
    type: 'info',
    title: 'Обновление готово',
    message: 'Обновление скачано и готово к установке',
    detail: 'Установить обновление сейчас? Приложение перезапустится.',
    buttons: ['Установить сейчас', 'Установить при выходе'],
    defaultId: 0,
    cancelId: 1
  }).then(({ response }) => {
    if (response === 0) {
      setImmediate(() => {
        autoUpdater.quitAndInstall();
      });
    }
  });
});