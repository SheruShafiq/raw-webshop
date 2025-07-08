const fs = require("fs");
const path = require("path");
const express = require("express");
const jsonServer = require("json-server");
const fetch = (...args) => import('node-fetch').then(mod => mod.default(...args));
const crypto = require("crypto");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;
const GITHUB_ENABLED = process.env.GITHUB_SYNC !== "false";
const SYNC_INTERVAL = parseInt(process.env.SYNC_INTERVAL_SECONDS) || 30; 

const GITHUB_OWNER = "SheruShafiq";
const GITHUB_REPO = "raw-webshop";
const GITHUB_FILE_PATH = "db.json";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const LOCAL_DB_PATH = path.join(__dirname, process.env.DB_NAME || "db.json");

const headers = {
    Authorization: `token ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github.v3+json",
};

let isGitHubSyncInProgress = false;
const pendingSyncs = [];
let lastContentHash = null;
let periodicSyncInterval = null;


function getHash(content) {
    return crypto.createHash("sha1").update(content).digest("hex");
}

async function fetchRemoteDb() {
    if (!GITHUB_ENABLED) return;
    console.log("🔄 Fetching db.json from GitHub...");
    const url = "https://api.github.com/repos/" + GITHUB_OWNER + "/" + GITHUB_REPO + "/contents/" + GITHUB_FILE_PATH;
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error("GitHub fetch error: " + response.statusText);
    const data = await response.json();
    const content = Buffer.from(data.content, "base64").toString("utf-8");
    
    
    try {
        JSON.parse(content);
    } catch (jsonError) {
        throw new Error("Invalid JSON from GitHub: " + jsonError.message);
    }
    
    fs.writeFileSync(LOCAL_DB_PATH, content);
    lastContentHash = getHash(content);
    console.log("✅ Successfully fetched and validated db.json from GitHub");
    return data.sha;
}

async function syncWithGitHub() {
    if (!GITHUB_ENABLED || isGitHubSyncInProgress) return;
    
    isGitHubSyncInProgress = true;
    
    try {
        console.log("🔄 Starting bidirectional GitHub sync...");
        
        
        const url = "https://api.github.com/repos/" + GITHUB_OWNER + "/" + GITHUB_REPO + "/contents/" + GITHUB_FILE_PATH;
        const response = await fetch(url, { headers });
        
        if (!response.ok) {
            console.log("⚠️ Could not fetch remote database:", response.status, response.statusText);
            return;
        }

        const remoteData = await response.json();
        const remoteContent = Buffer.from(remoteData.content, "base64").toString("utf-8");
        
        
        const localContent = fs.readFileSync(LOCAL_DB_PATH, "utf-8");
        const localStats = fs.statSync(LOCAL_DB_PATH);
        
        
        let remoteModified;
        try {
            
            const commitUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/commits?path=${GITHUB_FILE_PATH}&per_page=1`;
            const commitResponse = await fetch(commitUrl, { headers });
            if (commitResponse.ok) {
                const commits = await commitResponse.json();
                if (commits.length > 0) {
                    remoteModified = new Date(commits[0].commit.committer.date);
                } else {
                    remoteModified = new Date(0); 
                }
            } else {
                remoteModified = new Date(0); 
            }
        } catch (error) {
            remoteModified = new Date(0); 
        }
        
        const localModified = localStats.mtime;
        
        console.log(`📅 Remote modified: ${remoteModified.toISOString()}`);
        console.log(`📅 Local modified: ${localModified.toISOString()}`);
        
        
        const remoteHash = getHash(remoteContent);
        const localHash = getHash(localContent);
        
        if (remoteHash === localHash) {
            console.log("✅ Local and remote databases are identical");
            lastContentHash = localHash;
            return;
        }
        
        
        if (remoteModified > localModified) {
            
            console.log("⬇️ Remote database is newer, pulling from GitHub...");
            
            try {
                JSON.parse(remoteContent);
            } catch (jsonError) {
                console.error("❌ Remote database has invalid JSON, skipping update:", jsonError.message);
                return;
            }
            
            
            const backupPath = LOCAL_DB_PATH + '.backup.' + Date.now();
            fs.copyFileSync(LOCAL_DB_PATH, backupPath);
            console.log(`📋 Created backup: ${path.basename(backupPath)}`);
            
            
            fs.writeFileSync(LOCAL_DB_PATH, remoteContent);
            lastContentHash = remoteHash;
            
            
            if (global.jsonServerRouter) {
                global.jsonServerRouter.db.read();
                console.log("🔄 Reloaded json-server database");
            }
            
            console.log("✅ Local database updated from GitHub");
            
        } else {
            
            console.log("⬆️ Local database is newer, pushing to GitHub...");
            
            try {
                JSON.parse(localContent);
            } catch (jsonError) {
                console.error("❌ Local database has invalid JSON, skipping push:", jsonError.message);
                return;
            }
            
            const encodedContent = Buffer.from(localContent).toString("base64");
            
            const putResponse = await fetch(url, {
                method: "PUT",
                headers,
                body: JSON.stringify({
                    message: `Update db.json from Wall Market server - ${new Date().toISOString()}`,
                    content: encodedContent,
                    sha: remoteData.sha,
                }),
            });

            if (!putResponse.ok) {
                const errorText = await putResponse.text();
                console.error("❌ Failed to update GitHub:", putResponse.status, putResponse.statusText, errorText);
            } else {
                lastContentHash = localHash;
                console.log("✅ Local database pushed to GitHub");
            }
        }
        
        
        try {
            const backupFiles = fs.readdirSync(__dirname)
                .filter(file => file.startsWith('db.json.backup.'))
                .sort()
                .reverse();
            
            if (backupFiles.length > 5) {
                for (let i = 5; i < backupFiles.length; i++) {
                    fs.unlinkSync(path.join(__dirname, backupFiles[i]));
                }
            }
        } catch (cleanupError) {
            console.log("⚠️ Could not clean up old backups:", cleanupError.message);
        }
        
    } catch (error) {
        console.log("⚠️ Error during GitHub sync:", error.message);
    } finally {
        isGitHubSyncInProgress = false;
        
        
        if (pendingSyncs.length > 0) {
            const latestContent = pendingSyncs.pop();
            pendingSyncs.length = 0; 
            setTimeout(() => syncWithGitHub(), 1000); 
        }
    }
}

async function initializeServer() {
    
    if (!fs.existsSync(LOCAL_DB_PATH)) {
        console.log("📝 Creating default db.json file...");
        const defaultDb = {
            roles: [],
            statuses: [],
            users: [],
            userProfiles: [],
            categories: [],
            products: [],
            carts: [],
            orders: []
        };
        fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(defaultDb, null, 2));
    }

    try {
        if (GITHUB_ENABLED) {
            await fetchRemoteDb();
            console.log("✅ Pulled db.json from GitHub");
        }
    } catch (err) {
        console.error("❌ Failed to load db.json from GitHub:", err.message);
        if (GITHUB_ENABLED) {
            console.log("⚠️ Continuing with local db.json file...");
        }
    }

    
    const jsonServerRouter = jsonServer.router(LOCAL_DB_PATH);
    const middlewares = jsonServer.defaults();
    
    
    global.jsonServerRouter = jsonServerRouter;

    
    
    

    
    app.use((req, res, next) => {
        const allowedOrigin = process.env.FRONTEND_URL || "*";
        res.header("Access-Control-Allow-Origin", allowedOrigin);
        res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
        res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
        if (req.method === "OPTIONS") return res.sendStatus(200);
        next();
    });

    
    app.use(express.static(__dirname, {
        index: 'index.html',
        setHeaders: (res, path) => {
            
            if (path.endsWith('.js')) {
                res.setHeader('Content-Type', 'application/javascript');
            } else if (path.endsWith('.css')) {
                res.setHeader('Content-Type', 'text/css');
            } else if (path.endsWith('.html')) {
                res.setHeader('Content-Type', 'text/html');
            }
        }
    }));

    
    app.use('/api/carts', (req, res, next) => {
        if (req.method === 'DELETE') {
            const cartId = req.params.id || req.url.split('/').pop();
            
            
            try {
                const dbContent = fs.readFileSync(LOCAL_DB_PATH, 'utf-8');
                const db = JSON.parse(dbContent);
                
                
                const cartIndex = db.carts.findIndex(cart => cart.id === cartId);
                if (cartIndex !== -1) {
                    db.carts.splice(cartIndex, 1);
                    
                    
                    fs.writeFileSync(LOCAL_DB_PATH, JSON.stringify(db, null, 2));
                    
                    
                    if (global.jsonServerRouter) {
                        global.jsonServerRouter.db.read();
                    }
                    
                    
                    if (GITHUB_ENABLED) {
                        setTimeout(async () => {
                            try {
                                const updatedContent = fs.readFileSync(LOCAL_DB_PATH, "utf-8");
                                await pushDbToGitHub(updatedContent);
                                console.log("🕒 Synced db.json to GitHub after cart deletion");
                            } catch (err) {
                                console.error("❌ Failed to sync cart deletion to GitHub:", err.message);
                            }
                        }, 1000);
                    }
                    
                    res.status(200).json({ message: 'Cart deleted successfully', id: cartId });
                    return;
                } else {
                    res.status(404).json({ error: 'Cart not found', id: cartId });
                    return;
                }
            } catch (error) {
                console.error('Error in custom cart deletion:', error);
                
                next();
            }
        } else {
            next();
        }
    });

    
    app.get('/api', (req, res) => {
        try {
            const db = jsonServerRouter.db.getState();
            const resources = Object.keys(db);
            const baseUrl = `${req.protocol}://${req.get('host')}/api`;
            
            const response = {
                message: "Wall Market Online API",
                version: "1.0.0",
                resources: resources.reduce((acc, resource) => {
                    acc[resource] = {
                        url: `${baseUrl}/${resource}`,
                        count: Array.isArray(db[resource]) ? db[resource].length : 1
                    };
                    return acc;
                }, {}),
                endpoints: {
                    products: `${baseUrl}/products`,
                    categories: `${baseUrl}/categories`,
                    users: `${baseUrl}/users`,
                    carts: `${baseUrl}/carts`,
                    orders: `${baseUrl}/orders`,
                    roles: `${baseUrl}/roles`,
                    statuses: `${baseUrl}/statuses`,
                    userProfiles: `${baseUrl}/userProfiles`
                }
            };
            
            res.json(response);
        } catch (error) {
            console.error('Error in /api root endpoint:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    
    app.use('/api', middlewares, jsonServer.bodyParser, jsonServerRouter);

    
    app.get('*', (req, res) => {
        
        if (req.url.startsWith('/api/')) {
            return res.status(404).json({ error: 'API endpoint not found' });
        }
        
        
        res.sendFile(path.join(__dirname, 'index.html'));
    });

    app.listen(port, () => {
        console.log(`🚀 Wall Market Online server running on port ${port}`);
        console.log(`📂 Serving static files from: ${__dirname}`);
        console.log(`🔌 API available at: http://localhost:${port}/api`);
        console.log(`🌐 Frontend available at: http://localhost:${port}`);
        if (!GITHUB_ENABLED) {
            console.log("⚠️ GitHub sync is DISABLED (GITHUB_SYNC=false)");
        } else {
            console.log("🔄 GitHub sync is ENABLED");
            
            periodicSyncInterval = setInterval(async () => {
                await syncWithGitHub();
            }, SYNC_INTERVAL * 1000); 
            
            console.log(`⏱️ Periodic bidirectional GitHub sync enabled (every ${SYNC_INTERVAL} seconds)`);
            console.log(`📋 Sync strategy: Compare timestamps, use most recent version`);
        }
    });
}


process.on('SIGTERM', () => {
    console.log('👋 Received SIGTERM, shutting down gracefully...');
    if (periodicSyncInterval) {
        clearInterval(periodicSyncInterval);
        console.log('⏹️ Stopped periodic GitHub sync');
    }
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('👋 Received SIGINT, shutting down gracefully...');
    if (periodicSyncInterval) {
        clearInterval(periodicSyncInterval);
        console.log('⏹️ Stopped periodic GitHub sync');
    }
    process.exit(0);
});


initializeServer().catch(err => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
});
