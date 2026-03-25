const axios = require('axios');

async function testTallyConnection() {
  console.log('Testing Tally Prime connection...');
  
  try {
    // Test 1: Simple POST with XML (like your app does)
    const xmlRequest = `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
    <TYPE>Data</TYPE>
  </HEADER>
  <BODY>
    <EXPORTDATA>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>XML</SVEXPORTFORMAT>
      </STATICVARIABLES>
      <REQUESTDESC>
        <REPORTNAME>List of Companies</REPORTNAME>
      </REQUESTDESC>
    </EXPORTDATA>
  </BODY>
</ENVELOPE>`;

    console.log('Sending POST request to Tally Prime...');
    const response = await axios.post('http://localhost:9000', xmlRequest, {
      headers: {
        'Content-Type': 'application/xml'
      },
      timeout: 10000
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    console.log('Response data (first 200 chars):', response.data.substring(0, 200));
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testTallyConnection();
