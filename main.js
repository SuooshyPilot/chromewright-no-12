const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
// Simple persistence for last file
let lastFilePath = null;
const CONFIG_FILE = path.join(app.getPath('userData'), 'config.json');

function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
            if (config.lastFilePath && fs.existsSync(config.lastFilePath)) {
                lastFilePath = config.lastFilePath;
            }
        }
    } catch (e) {
        console.error('Failed to load config', e);
    }
}

function saveConfig() {
    try {
        fs.writeFileSync(CONFIG_FILE, JSON.stringify({ lastFilePath }), 'utf8');
    } catch (e) {
        console.error('Failed to save config', e);
    }
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        backgroundColor: '#111111',
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });

    // Remove default menu for “appliance” feel
    Menu.setApplicationMenu(null);

    mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

    mainWindow.on('ready-to-show', () => {
        mainWindow.maximize();
        mainWindow.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    loadConfig();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    // On a dedicated machine you might want to quit outright
    if (process.platform !== 'darwin') app.quit();
});

// IPC: load saved content
ipcMain.handle('cw:load', async () => {
    // If we have a last file, try to load it
    if (lastFilePath) {
        try {
            const text = fs.readFileSync(lastFilePath, 'utf8');
            return { text, filePath: lastFilePath, filename: path.basename(lastFilePath) };
        } catch (err) {
            console.error('Failed to load last file', err);
        }
    }
    return { text: '', filePath: null, filename: 'Untitled' };
});

// IPC: save content (overwrite current file)
ipcMain.handle('cw:save', async (_event, { text, filePath }) => {
    let targetPath = filePath;

    // If no path provided, treat as Save As
    if (!targetPath) {
        // We can't do a silent save if we don't have a path. 
        // The renderer should have called save-as if path was null, 
        // but we handle it here just in case.
        return { success: false, canceled: true };
    }

    try {
        fs.writeFileSync(targetPath, text, 'utf8');
        lastFilePath = targetPath;
        saveConfig();
        return { success: true, filePath: targetPath, filename: path.basename(targetPath) };
    } catch (e) {
        return { success: false, error: e.message };
    }
});

// IPC: Save As
ipcMain.handle('cw:save-as', async (_event, text) => {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
        filters: [{ name: 'Text Files', extensions: ['txt', 'md'] }]
    });

    if (canceled || !filePath) {
        return { canceled: true };
    }

    fs.writeFileSync(filePath, text, 'utf8');
    lastFilePath = filePath;
    saveConfig();
    return { success: true, filePath, filename: path.basename(filePath) };
});

// IPC: Open File
ipcMain.handle('cw:open', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile'],
        filters: [{ name: 'Text Files', extensions: ['txt', 'md'] }]
    });

    if (canceled || filePaths.length === 0) {
        return { canceled: true };
    }

    const filePath = filePaths[0];
    const text = fs.readFileSync(filePath, 'utf8');
    lastFilePath = filePath;
    saveConfig();

    return { success: true, text, filePath, filename: path.basename(filePath) };
});

// IPC: Auto-launch toggle
ipcMain.handle('cw:set-auto-launch', async (_event, enable) => {
    app.setLoginItemSettings({
        openAtLogin: enable,
        path: app.getPath('exe')
    });
    return app.getLoginItemSettings().openAtLogin;
});

ipcMain.handle('cw:get-auto-launch', async () => {
    return app.getLoginItemSettings().openAtLogin;
});
