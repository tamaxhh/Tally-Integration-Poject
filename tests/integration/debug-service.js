const { sendToTally } = require('./src/services/connectors/tally.client.js');
const { buildLedgerListXml } = require('./src/services/xml/builder/ledger.xml');
const { parseLedgerList } = require('./src/services/xml/parser/ledger.parser');
const cacheManager = require('./src/cache/simple-cache');
const config = require('./config');

async function testService() {
  console.log('Testing service flow...');
  
  try {
    // Step 1: Build XML
    console.log('1. Building XML...');
    const xmlRequest = buildLedgerListXml({ company: '' });
    console.log('XML built successfully, length:', xmlRequest.length);
    
    // Step 2: Send to Tally
    console.log('2. Sending to Tally...');
    const xmlResponse = await sendToTally(xmlRequest);
    console.log('Response received, length:', xmlResponse.length);
    
    // Step 3: Parse response
    console.log('3. Parsing response...');
    const result = parseLedgerList(xmlResponse);
    console.log('Parsed successfully:', result.total, 'ledgers found');
    
    // Step 4: Test cache
    console.log('4. Testing cache...');
    const cacheKey = 'tally:ledgers:default';
    await cacheManager.set(cacheKey, result, 300);
    const cached = await cacheManager.get(cacheKey);
    console.log('Cache test:', cached ? 'success' : 'failed');
    
    console.log('All tests passed!');
    
  } catch (error) {
    console.error('Error in service test:', error.message);
    console.error('Error code:', error.code);
    console.error('Stack:', error.stack);
  }
}

testService();
