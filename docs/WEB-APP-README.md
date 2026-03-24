# 🌐 Tally Remote Data Fetcher

A web application that allows you to connect to any Tally Prime installation remotely and fetch data through a user-friendly interface.

## 🚀 Quick Start

### **Option 1: Web Interface**
```bash
# Start the web application
npm run start:web

# Open browser
# Navigate to: http://localhost:3001
```

### **Option 2: API Usage**
```bash
# Test connection
curl -X POST http://localhost:3001/api/test-connection \
  -H "Content-Type: application/json" \
  -d '{"tallyUrl":"192.168.1.100:9000"}'

# Fetch ledgers
curl -X POST http://localhost:3001/api/fetch-tally-data \
  -H "Content-Type: application/json" \
  -d '{
    "tallyUrl":"192.168.1.100:9000",
    "requestType":"TrialBalance",
    "from":"2024-04-01",
    "to":"2025-03-31"
  }'
```

## 🎯 Features

### **🔗 Connection Management**
- **Test Connection**: Verify Tally connectivity before fetching data
- **Multiple Tally Instances**: Connect to different Tally installations
- **Real-time Status**: Visual connection status indicators
- **Response Time Monitoring**: Track connection performance

### **📊 Data Fetching**
- **Multiple Request Types**:
  - Trial Balance (Complete financial data)
  - Ledger Balance (Basic balances)
  - List of Ledgers (Names only)
  - Ledger Details (All fields)
- **Date Range Support**: Filter data by specific periods
- **Ledger Filtering**: Fetch data for specific ledgers
- **Error Handling**: Comprehensive error reporting

### **🎨 User Interface**
- **Modern Design**: Clean, responsive interface
- **Real-time Feedback**: Loading states and progress
- **Data Tables**: Formatted result display
- **JSON Output**: Raw response inspection
- **Mobile Friendly**: Responsive design for all devices

## 🔧 API Endpoints

### **POST /api/test-connection**
Tests connectivity to a Tally instance.

**Request:**
```json
{
  "tallyUrl": "192.168.1.100:9000"
}
```

**Response:**
```json
{
  "success": true,
  "connected": true,
  "responseTime": 245,
  "message": "Successfully connected to Tally",
  "tallyResponse": "<?xml version..."
}
```

### **POST /api/fetch-tally-data**
Fetches data from Tally based on specified parameters.

**Request:**
```json
{
  "tallyUrl": "192.168.1.100:9000",
  "requestType": "TrialBalance",
  "ledgerName": "Alfa Provisions",
  "from": "2024-04-01",
  "to": "2025-03-31"
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "Alfa Provisions",
      "openingBalance": -27700,
      "closingBalance": -151912,
      "parent": "Sundry Debtors",
      "guid": "4f3f4b54-ded8-4f7d-9d4e-4b3b175d09d9"
    }
  ],
  "meta": {
    "tallyUrl": "192.168.1.100:9000",
    "requestType": "TrialBalance",
    "ledgerName": "Alfa Provisions",
    "timestamp": "2026-03-24T11:30:00.000Z",
    "processingTime": 1234
  }
}
```

## 🏗️ Architecture

### **Frontend (HTML/CSS/JS)**
- **Responsive Design**: Works on desktop and mobile
- **Modern UI**: Clean, professional interface
- **Real-time Updates**: Dynamic status indicators
- **Error Handling**: User-friendly error messages

### **Backend (Node.js/Express)**
- **Express Server**: Lightweight web server
- **CORS Support**: Cross-origin requests
- **XML Generation**: Dynamic Tally XML requests
- **Data Parsing**: XML to JSON transformation
- **Error Handling**: Comprehensive error management

### **Tally Integration**
- **Dynamic XML Requests**: Based on request type
- **Multiple Data Types**: Support for various Tally reports
- **Connection Testing**: Pre-flight connectivity checks
- **Timeout Management**: Prevent hanging requests

## 🌐 Network Requirements

### **Tally Prime Requirements**
- **Network Access**: Web application must reach Tally server
- **Port 9000**: Tally XML API must be enabled
- **Company Open**: Tally company must be loaded
- **Firewall**: Port 9000 must be accessible

### **Network Scenarios**
```bash
# Local Tally
tallyUrl: "localhost:9000"

# Network Tally (same network)
tallyUrl: "192.168.1.100:9000"

# Remote Tally (different network)
tallyUrl: "203.0.113.45:9000"

# Tally with port mapping
tallyUrl: "external.company.com:9000"
```

## 🔒 Security Considerations

### **Network Security**
- **Firewall Rules**: Only allow access from trusted IPs
- **VPN Access**: Use VPN for remote Tally connections
- **Port Security**: Change default Tally port if needed
- **Access Logs**: Monitor Tally access logs

### **Application Security**
- **Input Validation**: All inputs are validated
- **Error Handling**: No sensitive information leaked
- **CORS Configuration**: Restrict origins in production
- **Rate Limiting**: Prevent abuse (implement as needed)

## 🚀 Deployment

### **Local Development**
```bash
# Install dependencies
npm install

# Start development server
npm run dev:web

# Production build
npm run start:web
```

### **Docker Deployment**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["node", "web-app.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  tally-web-app:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

### **Production Hosting**
- **Node.js Hosting**: Deploy to any Node.js hosting service
- **Reverse Proxy**: Use Nginx/Apache for SSL termination
- **Environment Variables**: Configure Tally URLs securely
- **Monitoring**: Track application performance and uptime

## 📱 Usage Instructions

### **Step 1: Launch Application**
1. Start the web application
2. Open browser to `http://localhost:3001`
3. Configure Tally connection settings

### **Step 2: Test Connection**
1. Enter Tally server URL (e.g., `192.168.1.100:9000`)
2. Click "Test Connection" button
3. Verify connection status turns green

### **Step 3: Fetch Data**
1. Select request type from dropdown
2. Optionally specify ledger name and date range
3. Click "Fetch Data" button
4. View results in table and JSON format

### **Step 4: Analyze Results**
1. Review formatted data table
2. Inspect raw JSON response
3. Export data for further analysis
4. Save connection configurations for reuse

## 🎯 Use Cases

### **Accounting Teams**
- **Remote Data Access**: Fetch financial data without VPN
- **Multi-location Support**: Connect to different branch Tally instances
- **Data Integration**: Export data for reporting systems
- **Audit Support**: Access historical data for audits

### **IT Administrators**
- **Centralized Access**: Single interface for multiple Tally instances
- **Connection Monitoring**: Track Tally availability and performance
- **Troubleshooting**: Test connectivity issues remotely
- **Security Management**: Control access to Tally data

### **Business Users**
- **Self-service Access**: Get data without IT assistance
- **Real-time Information**: Access up-to-date financial data
- **Mobile Access**: Fetch data from any device
- **Data Export**: Export for analysis in other tools

## 🛠️ Troubleshooting

### **Connection Issues**
- **Check Network**: Verify network connectivity to Tally server
- **Firewall**: Ensure port 9000 is open
- **Tally Status**: Confirm Tally is running and company is open
- **URL Format**: Use correct format (host:port)

### **Data Issues**
- **Date Range**: Verify dates are within available data range
- **Ledger Names**: Use exact names from Tally
- **Request Type**: Choose appropriate type for needed data
- **Permissions**: Ensure Tally user has required permissions

### **Performance Issues**
- **Network Latency**: Check network speed to Tally server
- **Large Data Sets**: Use date ranges to limit data size
- **Timeout Settings**: Adjust for slow connections
- **Concurrent Requests**: Avoid multiple simultaneous requests

## 📊 Supported Request Types

| Request Type | Description | Returns | Use Case |
|-------------|-------------|---------|----------|
| TrialBalance | Complete financial data with opening/closing balances | Financial reporting |
| LedgerBalance | Basic ledger balance information | Quick balance checks |
| ListOfLedgers | Simple list of ledger names | Ledger discovery |
| LedgerDetails | Comprehensive ledger information | Detailed analysis |

## 🎉 Ready to Use!

Your Tally Remote Data Fetcher is now ready for:
- ✅ **Remote Data Access** from any Tally Prime installation
- ✅ **User-Friendly Interface** for non-technical users
- ✅ **Flexible Data Fetching** with multiple request types
- ✅ **Production Deployment** capabilities
- ✅ **Mobile Access** from any device

**🚀 Start fetching Tally data remotely today!**
