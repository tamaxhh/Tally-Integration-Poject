const express = require('express');
const path = require('path');
const axios = require('axios');
const XMLParser = require('fast-xml-parser').XMLParser;

// Handle pkg packaging
const isPkg = typeof process.pkg !== 'undefined';
const basePath = isPkg ? path.dirname(process.execPath) : __dirname;

class TallyWebApp {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3001;
    this.setupMiddleware();
    this.setupRoutes();
    this.setupStaticFiles();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      next();
    });
  }

  setupStaticFiles() {
    this.app.use(express.static(path.join(basePath, 'public')));
  }

  setupRoutes() {
    // Home page
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    });

    // API endpoint to fetch Tally data
    this.app.post('/api/fetch-tally-data', async (req, res) => {
      try {
        const { tallyUrl, requestType, ledgerName, from, to, apiKey } = req.body;

        // Validation
        if (!tallyUrl) {
          return res.status(400).json({ 
            success: false, 
            error: 'Tally URL is required' 
          });
        }

        // Build XML request based on type
        const xmlRequest = this.buildTallyRequest(requestType, ledgerName, from, to);

        // Make request to Tally
        const response = await axios.post(`http://${tallyUrl}`, xmlRequest, {
          headers: { 'Content-Type': 'text/xml' },
          timeout: 15000
        });

        // Parse XML response
        const parser = new XMLParser();
        const result = parser.parse(response.data);

        // Process response based on request type
        const processedData = this.processResponse(result, requestType);

        res.json({
          success: true,
          data: processedData,
          meta: {
            tallyUrl: tallyUrl,
            requestType: requestType,
            ledgerName: ledgerName,
            timestamp: new Date().toISOString(),
            processingTime: Date.now() - startTime
          }
        });

      } catch (error) {
        console.error('Tally fetch error:', error);
        res.status(500).json({
          success: false,
          error: error.message,
          details: error.response?.data || 'No additional details available'
        });
      }
    });

    // Test connection endpoint
    this.app.post('/api/test-connection', async (req, res) => {
      try {
        const { tallyUrl } = req.body;
        
        if (!tallyUrl) {
          return res.status(400).json({ 
            success: false, 
            error: 'Tally URL is required' 
          });
        }

        const startTime = Date.now();
        const testXml = `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>Test Connection</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="Test Connection" ISMODIFY="No">
            <TYPE>Company</TYPE>
            <FETCH>NAME</FETCH>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;

        const response = await axios.post(`http://${tallyUrl}`, testXml, {
          headers: { 'Content-Type': 'text/xml' },
          timeout: 10000
        });

        res.json({
          success: true,
          connected: true,
          responseTime: Date.now() - startTime,
          message: 'Successfully connected to Tally',
          tallyResponse: response.data.substring(0, 200) + '...'
        });

      } catch (error) {
        res.status(500).json({
          success: false,
          connected: false,
          error: error.message,
          message: 'Failed to connect to Tally'
        });
      }
    });

    // Get available request types
    this.app.get('/api/request-types', (req, res) => {
      res.json({
        success: true,
        requestTypes: [
          {
            id: 'TrialBalance',
            name: 'Trial Balance',
            description: 'Complete financial data with opening/closing balances',
            returns: ['ledgers', 'openingBalance', 'closingBalance', 'parent', 'guid']
          },
          {
            id: 'LedgerBalance',
            name: 'Ledger Balance',
            description: 'Basic ledger balance information',
            returns: ['ledgers', 'openingBalance', 'closingBalance', 'currentBalance']
          },
          {
            id: 'ListOfLedgers',
            name: 'List of Ledgers',
            description: 'Simple list of ledger names',
            returns: ['ledgers', 'name']
          },
          {
            id: 'LedgerDetails',
            name: 'Ledger Details',
            description: 'Comprehensive ledger information',
            returns: ['ledger', 'allFields']
          }
        ]
      });
    });
  }

  buildTallyRequest(type, ledgerName, from, to) {
    const requests = {
      TrialBalance: {
        id: 'Trial Balance',
        fetch: '<FETCH>*</FETCH>',
        staticVars: from && to 
          ? `<STATICVARIABLES><SVFROMDATE>${from}</SVFROMDATE><SVTODATE>${to}</SVTODATE></STATICVARIABLES>`
          : '<STATICVARIABLES><SVEXPORTFORMAT>XML</SVEXPORTFORMAT></STATICVARIABLES>'
      },
      LedgerBalance: {
        id: 'Ledger Balance',
        fetch: '<FETCH>NAME,OPENINGBALANCE,CLOSINGBALANCE,CURRENTBALANCE,PARENT,GUID</FETCH>',
        staticVars: '<STATICVARIABLES><SVEXPORTFORMAT>XML</SVEXPORTFORMAT></STATICVARIABLES>'
      },
      ListOfLedgers: {
        id: 'List of Ledgers',
        fetch: '<FETCH>NAME</FETCH>',
        staticVars: '<STATICVARIABLES><SVEXPORTFORMAT>XML</SVEXPORTFORMAT></STATICVARIABLES>'
      },
      LedgerDetails: {
        id: 'Ledger Details',
        fetch: '<FETCH>*</FETCH>',
        staticVars: ledgerName 
          ? `<STATICVARIABLES><SVEXPORTFORMAT>XML</SVEXPORTFORMAT></STATICVARIABLES>`
          : '<STATICVARIABLES><SVEXPORTFORMAT>XML</SVEXPORTFORMAT></STATICVARIABLES>'
      }
    };

    const config = requests[type] || requests.TrialBalance;
    
    let xmlRequest = `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>${config.id}</ID>
  </HEADER>
  <BODY>
    <DESC>
      ${config.staticVars}
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="${config.id}" ISMODIFY="No">
            <TYPE>Ledger</TYPE>
            ${config.fetch}`;

    if (ledgerName && type === 'LedgerDetails') {
      xmlRequest += `
            <FILTER>NAME = "${ledgerName}"</FILTER>`;
    }

    xmlRequest += `
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;

    return xmlRequest;
  }

  processResponse(result, requestType) {
    const data = result.ENVELOPE?.BODY?.DATA;
    
    switch (requestType) {
      case 'TrialBalance':
      case 'LedgerBalance':
        if (data?.COLLECTION?.LEDGER) {
          const ledgers = Array.isArray(data.COLLECTION.LEDGER) 
            ? data.COLLECTION.LEDGER 
            : [data.COLLECTION.LEDGER];
          
          return ledgers.map(ledger => ({
            name: this.extractLedgerName(ledger),
            openingBalance: this.parseAmount(ledger.OPENINGBALANCE),
            closingBalance: this.parseAmount(ledger.CLOSINGBALANCE),
            currentBalance: this.parseAmount(ledger.CURRENTBALANCE),
            parent: ledger.PARENT || ledger.PARENTNAME || ledger.GROUP,
            guid: ledger.GUID || ledger.ID || ledger.UNIQUEID
          }));
        }
        break;

      case 'ListOfLedgers':
        if (data?.COLLECTION?.LEDGER) {
          const ledgers = Array.isArray(data.COLLECTION.LEDGER) 
            ? data.COLLECTION.LEDGER 
            : [data.COLLECTION.LEDGER];
          
          return ledgers.map(ledger => ({
            name: this.extractLedgerName(ledger)
          }));
        }
        break;

      case 'LedgerDetails':
        if (data?.COLLECTION?.LEDGER) {
          const ledger = data.COLLECTION.LEDGER;
          return {
            name: this.extractLedgerName(ledger),
            ...ledger // Return all fields
          };
        }
        break;

      default:
        return data || {};
    }

    return [];
  }

  extractLedgerName(ledger) {
    if (ledger['LANGUAGENAME.LIST']?.['NAME.LIST']?.NAME) {
      return ledger['LANGUAGENAME.LIST']['NAME.LIST'].NAME.replace(/&#13;&#10;/g, '').trim();
    } else if (ledger.LANGUAGENAME?.LIST?.NAME?.LIST) {
      const nameList = Array.isArray(ledger.LANGUAGENAME.LIST.NAME.LIST) 
        ? ledger.LANGUAGENAME.LIST.NAME.LIST 
        : [ledger.LANGUAGENAME.LIST.NAME.LIST];
      
      if (nameList.length > 0 && nameList[0].NAME) {
        return nameList[0].NAME.replace(/&#13;&#10;/g, '').trim();
      }
    } else if (ledger.NAME) {
      return ledger.NAME.replace(/&#13;&#10;/g, '').trim();
    } else if (ledger.LANGUAGENAME?.LIST?.NAME) {
      return ledger.LANGUAGENAME.LIST.NAME.replace(/&#13;&#10;/g, '').trim();
    }
    return 'Unknown';
  }

  parseAmount(value) {
    if (!value || value === '') return null;
    
    if (typeof value === 'string') {
      value = value.trim();
      if (value.startsWith('(') && value.endsWith(')')) {
        return -parseFloat(value.slice(1, -1));
      }
      return parseFloat(value) || null;
    }
    return parseFloat(value) || null;
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`🌐 Tally Web Application running on port ${this.port}`);
      console.log(`📱 Access at: http://localhost:${this.port}`);
      console.log(`🔗 API endpoint: http://localhost:${this.port}/api/fetch-tally-data`);
    });
  }
}

// Start the application
const app = new TallyWebApp();
app.start();

module.exports = TallyWebApp;
