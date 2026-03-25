const axios = require('axios');

// Test exact same configuration as the tally client
const tallyHttp = axios.create({
  baseURL: 'http://localhost:9000',
  timeout: 10000,
  headers: {
    'Content-Type': 'text/xml;charset=utf-8',
    'Accept': 'text/xml',
  },
  responseType: 'text',
});

const xmlPayload = `<?xml version="1.0" encoding="utf-8"?>
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
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="List of Ledgers" ISMODIFY="No">
            <TYPE>Ledger</TYPE>
            <FETCH>NAME</FETCH>
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;

async function testConnection() {
  console.log('Testing connection to Tally...');
  
  try {
    console.log('Sending request...');
    const response = await tallyHttp.post('/', xmlPayload);
    console.log('Success! Response status:', response.status);
    console.log('Response length:', response.data.length);
    console.log('First 200 chars:', response.data.substring(0, 200));
  } catch (error) {
    console.error('Error occurred:');
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testConnection();
