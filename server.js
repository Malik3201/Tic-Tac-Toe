/**
 * Simple server for the Neon Tic Tac Toe game
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Port to use
const PORT = process.env.PORT || 3000;

// MIME types
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav'
};

// Create the server
const server = http.createServer((req, res) => {
    // Parse the URL
    let url = req.url;
    
    // Check for room URL format
    if (url.startsWith('/room/')) {
        // This is a room URL, we should serve the index.html
        url = '/index.html';
    }
    
    // If URL is /, serve index.html
    if (url === '/') {
        url = '/index.html';
    }
    
    // Get the file path
    const filePath = path.join(__dirname, url);
    
    // Get the file extension
    const extname = String(path.extname(filePath)).toLowerCase();
    
    // Get the MIME type
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';
    
    // Read the file
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                // File not found, serve 404
                fs.readFile(path.join(__dirname, '404.html'), (error, content) => {
                    if (error) {
                        // Can't even read 404 page, just send a basic 404 response
                        res.writeHead(404);
                        res.end('404 Not Found');
                    } else {
                        res.writeHead(404, { 'Content-Type': 'text/html' });
                        res.end(content, 'utf-8');
                    }
                });
            } else {
                // Server error
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`);
            }
        } else {
            // Success
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

// Start the server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Open http://localhost:${PORT} in your browser`);
}); 