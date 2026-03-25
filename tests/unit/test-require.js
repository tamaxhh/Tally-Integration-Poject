console.log('Testing basic require...');
try {
  const { buildServer } = require('./src/app');
  console.log('SUCCESS: buildServer loaded');
  console.log('buildServer type:', typeof buildServer);
} catch(e) {
  console.error('ERROR:', e.message);
  console.error('STACK:', e.stack);
}
