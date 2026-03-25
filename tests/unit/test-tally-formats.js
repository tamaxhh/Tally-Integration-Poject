const axios = require('axios');

async function testTallyFormats() {
  console.log('Testing different XML formats for Tally Prime...');
  
  // Test different request types
  const testRequests = [
    {
      name: 'Collection',
      xml: `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>Export Data</TALLYREQUEST>
    <TYPE>Collection</TYPE>
  </HEADER>
  <BODY>
    <STATICVARIABLES>
      <SVEXPORTFORMAT>XML</SVEXPORTFORMAT>
    </STATICVARIABLES>
  </BODY>
</ENVELOPE>`
    },
    {
      name: 'Simple Request',
      xml: `<?xml version="1.0" encoding="utf-8"?>
<REQUEST>
  <EXPORTDATA>
    <REPORTNAME>List of Companies</REPORTNAME>
  </EXPORTDATA>
</REQUEST>`
    }
  ];
  
  for (const test of testRequests) {
    try {
      console.log(`\n=== Testing ${test.name} ===`);
      const response = await axios.post('http://localhost:9000', test.xml, {
        headers: {
          'Content-Type': 'application/xml'
        },
        timeout: 5000
      });
      
      console.log(`Status: ${response.status}`);
      console.log(`Response: ${response.data}`);
      
    } catch (error) {
      console.error(`Error with ${test.name}:`, error.message);
    }
  }
}

testTallyFormats();
