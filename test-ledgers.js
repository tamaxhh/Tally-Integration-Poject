// Simple script to test Tally data fetching
const axios = require('axios');
const XMLParser = require('fast-xml-parser').XMLParser;

async function testTally() {
  try {
    const xmlRequest = `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
    <TYPE>Collection</TYPE>
    <ID>List of Ledgers</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>XML</SVEXPORTFORMAT>
        <SVFROMDATE>20230401</SVFROMDATE>
        <SVTODATE>20240331</SVTODATE>
      </STATICVARIABLES>
    </DESC>
  </BODY>
</ENVELOPE>`;

    console.log('Sending request to Tally...');
    const response = await axios.post('http://localhost:9000', xmlRequest, {
      headers: { 'Content-Type': 'text/xml' },
      timeout: 10000
    });

    const parser = new XMLParser();
    const result = parser.parse(response.data);

    console.log('\n=== TALLYMESSAGE STRUCTURE ===');
    const tallyMessage = Array.isArray(result.ENVELOPE?.BODY?.DATA?.TALLYMESSAGE) 
      ? result.ENVELOPE.BODY.DATA.TALLYMESSAGE 
      : [result.ENVELOPE?.BODY?.DATA?.TALLYMESSAGE || {}];

    console.log('Number of TALLYMESSAGE objects:', tallyMessage.length);
    
    tallyMessage.forEach((msg, i) => {
      console.log(`\n--- TALLYMESSAGE ${i + 1} ---`);
      console.log('Keys:', Object.keys(msg));
      
      if (msg.COLLECTION) {
        console.log('COLLECTION keys:', Object.keys(msg.COLLECTION));
        
        if (msg.COLLECTION.LEDGER) {
          console.log('LEDGER found!');
          const ledger = msg.COLLECTION.LEDGER;
          console.log('LEDGER keys:', Object.keys(ledger));
          console.log('LEDGER sample:', JSON.stringify(ledger, null, 2));
        }
      }
    });

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testTally();
