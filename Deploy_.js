/**
 * Server side deploy
 * 1. vercel config
 * 2. if you use cookies in cross site: use cors for your production url
 * 3. environment variable
*/

/* 
{
    "version": 2,
    "builds": [
        {
            "src": "./index.js",
            "use": "@vercel/node"
        }
    ],
    "routes": [
        {
            "src": "/(.*)",
            "dest": "/",
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
        }
    ]
}
*/