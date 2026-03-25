const { getLedgers } = require('./src/services/ledger/ledger.service');

async function testDirectTallyFetch() {
  console.log('Testing direct Tally fetch with retry logic...');
  
  try {
    const result = await getLedgers({
      bypassCache: true, // Force fresh fetch from Tally
      company: '' // Use default company
    });
    
    console.log('✅ SUCCESS!');
    console.log('Ledgers found:', result.total);
    console.log('From cache:', result.fromCache);
    console.log('First 3 ledgers:');
    result.ledgers.slice(0, 3).forEach((ledger, i) => {
      console.log(`${i + 1}. ${ledger.name} (Balance: ${ledger.openingBalance || 'N/A'})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Details:', error.details || 'No details available');
  }
}

testDirectTallyFetch();
