const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json({ limit: '10mb' }));
const PORT = process.env.WEB_PORT || 8081;

// Proxy API requests to backend
const http = require('http');
app.use('/api', (req, res) => {
    const bodyText = (req.method !== 'GET' && req.method !== 'HEAD' && req.body && Object.keys(req.body).length > 0)
        ? JSON.stringify(req.body)
        : null;

    const headers = {
        ...req.headers,
        host: '127.0.0.1:30001',
        accept: 'application/json'
    };
    if (bodyText) {
        headers['content-type'] = 'application/json';
        headers['content-length'] = Buffer.byteLength(bodyText);
    } else {
        delete headers['content-length'];
    }

    const options = {
        hostname: '127.0.0.1',
        port: 30001,
        path: '/api' + req.url,
        method: req.method,
        headers
    };

    const proxyReq = http.request(options, (proxyRes) => {
        let body = '';
        proxyRes.on('data', chunk => body += chunk);
        proxyRes.on('end', () => {
            res.status(proxyRes.statusCode);
            Object.entries(proxyRes.headers).forEach(([k, v]) => {
                if (k.toLowerCase() !== 'transfer-encoding') res.setHeader(k, v);
            });
            res.end(body);
        });
    });
    proxyReq.on('error', (e) => {
        res.status(502).json({ success: false, message: 'Backend unavailable: ' + e.message });
    });
    if (bodyText) {
        proxyReq.write(bodyText);
    }
    proxyReq.end();
});

// Serve static files from web directory
const webRoot = __dirname;
app.use(express.static(webRoot));

// Serve favicon
app.get('/favicon.png', (req, res) => {
    const iconPath = path.join(__dirname, '../client/build/logo_512x512.png');
    if (fs.existsSync(iconPath)) {
        res.sendFile(iconPath);
    } else {
        res.status(404).send('Not found');
    }
});

// All other routes serve the SPA
app.get('*', (req, res) => {
    res.sendFile(path.join(webRoot, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║   Web3ToolBox Web Dashboard                      ║
║                                                  ║
║   🌐 Web UI:    http://localhost:${PORT}            ║
║   🔌 API:       http://localhost:30001           ║
║                                                  ║
║   Press Ctrl+C to stop                           ║
╚══════════════════════════════════════════════════╝
    `);
});

module.exports = app;
