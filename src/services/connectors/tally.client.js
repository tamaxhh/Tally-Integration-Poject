/**
 * src/services/connectors/tally.client.js
 *
 * WORKING VERSION - Direct connection proven to work
 */

'use strict';

const axios = require('axios');

// Use environment variables for Tally connection
const tallyHttp = axios.create({
  baseURL: `http://${process.env.TALLY_HOST || '127.0.0.1'}:${process.env.TALLY_PORT || 9000}`,
  timeout: 10000,
  headers: {
    'Content-Type': 'text/xml;charset=utf-8',
    'Accept': 'text/xml',
  },
  responseType: 'text',
});

console.log(`✅ TALLY CLIENT LOADED - ${process.env.TALLY_HOST || '127.0.0.1'}:${process.env.TALLY_PORT || 9000}`);

async function sendToTally(xmlPayload, options = {}) {
  console.log('CLIENT CALLED - Sending XML to Tally...');
  console.log('XML length:', xmlPayload.length);
  
  try {
    const response = await tallyHttp.post('/', xmlPayload);
    console.log('✅ TALLY RESPONSE SUCCESS - Status:', response.status);
    return response.data;
  } catch (error) {
    console.error('❌ TALLY ERROR:', error.message);
    console.error('Error code:', error.code);
    throw error;
  }
}

async function isTallyOnline() {
  const pingXml = `<ENVELOPE><HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER><BODY><EXPORTDATA><REQUESTDESC><REPORTNAME>List of Companies</REPORTNAME></REQUESTDESC></EXPORTDATA></BODY></ENVELOPE>`;

  try {
    await sendToTally(pingXml);
    return true;
  } catch {
    return false;
  }
}

function getBreakerStatus() {
  return { state: 'DISABLED' };
}

module.exports = { sendToTally, isTallyOnline, getBreakerStatus };
