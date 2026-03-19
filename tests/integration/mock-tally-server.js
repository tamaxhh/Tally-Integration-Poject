'use strict';

const express = require('express');
const cors = require('cors');

class MockTallyServer {
  constructor() {
    this.app = express();
    this.server = null;
    this.port = 9001;
    this.mode = 'normal'; // normal, offline, slow, error
    
    this.setupRoutes();
  }

  setupRoutes() {
    this.app.use(cors());
    this.app.use(express.raw({ type: 'text/xml' }));

    // Health check endpoint
    this.app.get('/', (req, res) => {
      if (this.mode === 'offline') {
        return res.status(503).send('Service Unavailable');
      }
      
      res.set('Content-Type', 'text/xml');
      res.send(this.getHealthXML());
    });

    // Main XML endpoint
    this.app.post('/', (req, res) => {
      if (this.mode === 'offline') {
        return res.status(503).send('Service Unavailable');
      }

      if (this.mode === 'slow') {
        // Simulate slow Tally response
        return setTimeout(() => {
          this.handleXMLRequest(req, res);
        }, 10000); // 10 second delay
      }

      if (this.mode === 'error') {
        res.set('Content-Type', 'text/xml');
        res.send(this.getErrorXML());
        return;
      }

      this.handleXMLRequest(req, res);
    });
  }

  handleXMLRequest(req, res) {
    const xml = req.body.toString();
    
    res.set('Content-Type', 'text/xml');

    // Route based on XML content
    if (xml.includes('LEDGER')) {
      res.send(this.getLedgerXML());
    } else if (xml.includes('VOUCHER')) {
      res.send(this.getVoucherXML());
    } else if (xml.includes('TRIALBALANCE')) {
      res.send(this.getTrialBalanceXML());
    } else {
      res.send(this.getDefaultXML());
    }
  }

  getHealthXML() {
    return `<?xml version="1.0" encoding="UTF-8"?>
    <ENVELOPE>
      <HEADER>
        <VERSION>1</VERSION>
        <TALLYREQUEST>Export Data</TALLYREQUEST>
      </HEADER>
      <BODY>
        <STATUS>Ready</STATUS>
      </BODY>
    </ENVELOPE>`;
  }

  getLedgerXML() {
    return `<?xml version="1.0" encoding="UTF-8"?>
    <ENVELOPE>
      <HEADER>
        <VERSION>1</VERSION>
        <TALLYREQUEST>Export Data</TALLYREQUEST>
      </HEADER>
      <BODY>
        <DATA>
          <COLLECTION>
            <LEDGER NAME="Cash Account">
              <OPENINGBALANCE>5000.00</OPENINGBALANCE>
              <CLOSINGBALANCE>7500.00</CLOSINGBALANCE>
            </LEDGER>
            <LEDGER NAME="Bank Account">
              <OPENINGBALANCE>(10000.00)</OPENINGBALANCE>
              <CLOSINGBALANCE>(8500.00)</CLOSINGBALANCE>
            </LEDGER>
          </COLLECTION>
        </DATA>
      </BODY>
    </ENVELOPE>`;
  }

  getVoucherXML() {
    return `<?xml version="1.0" encoding="UTF-8"?>
    <ENVELOPE>
      <HEADER>
        <VERSION>1</VERSION>
        <TALLYREQUEST>Export Data</TALLYREQUEST>
      </HEADER>
      <BODY>
        <DATA>
          <COLLECTION>
            <VOUCHER>
              <DATE>1-Apr-2023</DATE>
              <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
              <VOUCHERNUMBER>45</VOUCHERNUMBER>
              <ALLLEDGERENTRIES.LIST>
                <LEDGERNAME>Cash Account</LEDGERNAME>
                <AMOUNT>5000.00</AMOUNT>
              </ALLLEDGERENTRIES.LIST>
            </VOUCHER>
          </COLLECTION>
        </DATA>
      </BODY>
    </ENVELOPE>`;
  }

  getTrialBalanceXML() {
    return `<?xml version="1.0" encoding="UTF-8"?>
    <ENVELOPE>
      <HEADER>
        <VERSION>1</VERSION>
        <TALLYREQUEST>Export Data</TALLYREQUEST>
      </HEADER>
      <BODY>
        <DATA>
          <COLLECTION>
            <LEDGER NAME="Cash Account">
              <CLOSINGBALANCE>7500.00</CLOSINGBALANCE>
            </LEDGER>
          </COLLECTION>
        </DATA>
      </BODY>
    </ENVELOPE>`;
  }

  getErrorXML() {
    return `<?xml version="1.0" encoding="UTF-8"?>
    <ENVELOPE>
      <HEADER>
        <VERSION>1</VERSION>
        <TALLYREQUEST>Export Data</TALLYREQUEST>
      </HEADER>
      <BODY>
        <ERROR>
          <LINEERROR>Invalid request format</LINEERROR>
        </ERROR>
      </BODY>
    </ENVELOPE>`;
  }

  getDefaultXML() {
    return this.getHealthXML();
  }

  setMode(mode) {
    this.mode = mode;
  }

  async start() {
    return new Promise((resolve) => {
      this.server = this.app.listen(this.port, () => {
        console.log(`Mock Tally server running on port ${this.port}`);
        resolve();
      });
    });
  }

  async stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('Mock Tally server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = new MockTallyServer();
