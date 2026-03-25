# Tally Remote Fetcher - Standalone Version

## **Overview**
This folder contains the standalone executable version of the Tally Remote Fetcher application.

## **File Structure**
```
standalone/
├── build.js              # Build script
├── server.js              # Entry point
├── package.json           # Package configuration
├── dist/                  # Build output
│   └── tally-remote-fetcher.exe
└── README.md              # This file
```

## **How to Build**

### **Prerequisites**
- Node.js installed
- All source files in parent directory

### **Build Process**
```bash
cd standalone
node build.js
```

### **What Gets Built**
- Single executable: `dist/tally-remote-fetcher.exe`
- Includes all dependencies bundled
- Compressed with Brotli for smaller size
- Target: Windows x64, Node.js 18

## **How to Use**

### **Option 1: Direct Execution**
```bash
cd standalone/dist
./tally-remote-fetcher.exe
```

### **Option 2: Installer (Future Enhancement)**
```bash
# Create installer with NSIS or Inno Setup
# Include auto-updater, system tray, etc.
```

## **Features**
- ✅ Real Tally data integration
- ✅ Circuit breaker protection
- ✅ 5-minute caching
- ✅ API key authentication
- ✅ Rate limiting (100 req/min)
- ✅ Error handling and logging
- ✅ Graceful shutdown

## **Technical Details**
- **Framework**: Fastify v4.x
- **Tally Integration**: XML API with circuit breaker
- **Caching**: In-memory cache with TTL
- **Authentication**: API key based
- **Size**: ~45-60MB (compressed)
- **Node Version**: 18 (LTS)

## **Distribution**
- Copy entire `standalone` folder for distribution
- User runs `tally-remote-fetcher.exe` directly
- No Node.js installation required
- Self-contained application

## **Troubleshooting**
- If executable fails: Check `dist/` folder exists
- If port 3000 busy: User can configure different port
- Logs: Check application logs in console output
