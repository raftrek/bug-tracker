import { app, BrowserWindow } from 'electron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const desktopServerPort = 3001;
const isPackaged = app.isPackaged;
const currentDir = path.dirname(fileURLToPath(import.meta.url));

const ensureInitialDatabase = () => {
    const userDataDir = app.getPath('userData');
    const dbPath = path.join(userDataDir, 'bug-tracker.db');
    const bundledDbCandidates = [
        path.join(process.resourcesPath, 'app.asar.unpacked', 'prisma', 'dev.db'),
        path.join(process.resourcesPath, 'app.asar', 'prisma', 'dev.db'),
        path.resolve(currentDir, '../prisma/dev.db')
    ];
    if (!fs.existsSync(dbPath)) {
        const bundledDbPath = bundledDbCandidates.find((candidate) => fs.existsSync(candidate));
        if (bundledDbPath) {
            fs.copyFileSync(bundledDbPath, dbPath);
        } else {
            fs.closeSync(fs.openSync(dbPath, 'w'));
        }
    }
    return dbPath;
};

const resolveServerEntry = () => {
    if (isPackaged) {
        return path.join(process.resourcesPath, 'app.asar', 'dist', 'server', 'index.js');
    }
    return path.resolve(currentDir, '../dist/server/index.js');
};

const resolveRendererEntry = () => {
    if (isPackaged) {
        return path.join(process.resourcesPath, 'app.asar', 'dist', 'index.html');
    }
    return path.resolve(currentDir, '../dist/index.html');
};

const startServer = async () => {
    const userDataDir = app.getPath('userData');
    const uploadsDir = path.join(userDataDir, 'uploads');
    fs.mkdirSync(uploadsDir, { recursive: true });
    const dbPath = ensureInitialDatabase();
    process.env.PORT = String(desktopServerPort);
    process.env.DATABASE_URL = `file:${dbPath}`;
    process.env.UPLOADS_DIR = uploadsDir;
    await import(pathToFileURL(resolveServerEntry()).href);
};

const createWindow = async () => {
    const win = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });
    await win.loadFile(resolveRendererEntry());
};

app.whenReady().then(async () => {
    await startServer();
    await createWindow();
    app.on('activate', async () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            await createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
