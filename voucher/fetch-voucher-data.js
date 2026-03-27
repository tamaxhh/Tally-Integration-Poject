/**
 * Standalone Voucher Data Fetcher for Tally
 * 
 * This script fetches voucher data from Tally without modifying the existing codebase.
 * It uses the same XML structure and connection logic as the main application.
 * 
 * Usage: node fetch-voucher-data.js
 */

const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Tally connection configuration
const tallyHttp = axios.create({
  baseURL: `http://${process.env.TALLY_HOST || '127.0.0.1'}:${process.env.TALLY_PORT || 9000}`,
  timeout: 30000,
  headers: {
    'Content-Type': 'text/xml;charset=utf-8',
    'Accept': 'text/xml',
  },
  responseType: 'text',
});

/**
 * Send XML request to Tally
 */
async function sendToTally(xmlPayload) {
  console.log('📡 Sending XML request to Tally...');
  console.log(`📊 XML length: ${xmlPayload.length} characters`);
  
  try {
    const response = await tallyHttp.post('/', xmlPayload);
    console.log('✅ Tally response received successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Tally connection error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    throw error;
  }
}

/**
 * Build XML to fetch detailed voucher data
 */
function buildDetailedVoucherXml(options = {}) {
  const { company = '', fromDate = '', toDate = '', voucherType = '' } = options;
  
  return `<?xml version="1.0" encoding="utf-8"?>
<ENVELOPE>
  <HEADER>
    <VERSION>1</VERSION>
    <TALLYREQUEST>EXPORT</TALLYREQUEST>
    <TYPE>COLLECTION</TYPE>
    <ID>AllVouchers</ID>
  </HEADER>
  <BODY>
    <DESC>
      <STATICVARIABLES>
        <SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>
        ${company ? `<SVCOMPANY>${company}</SVCOMPANY>` : ''}
        ${fromDate ? `<SVFROMDATE>${fromDate}</SVFROMDATE>` : ''}
        ${toDate ? `<SVTODATE>${toDate}</SVTODATE>` : ''}
      </STATICVARIABLES>
      <TDL>
        <TDLMESSAGE>
          <COLLECTION NAME="AllVouchers">
            <TYPE>Voucher</TYPE>
            <FETCH>DATE,VOUCHERTYPENAME,NARRATION,PARTYNAME,AMOUNT,ALLLEDGERENTRIES.LIST:*</FETCH>
            ${voucherType ? `<FILTER>VOUCHERTYPENAME = "${voucherType}"</FILTER>` : ''}
          </COLLECTION>
        </TDLMESSAGE>
      </TDL>
    </DESC>
  </BODY>
</ENVELOPE>`;
}

/**
 * Parse XML response and extract voucher data
 */
function parseVoucherResponse(xmlResponse) {
  try {
    // Simple XML parsing for voucher data
    const vouchers = [];
    
    // Extract VOUCHER elements using regex
    const voucherMatches = xmlResponse.match(/<VOUCHER[^>]*>[\s\S]*?<\/VOUCHER>/g);
    
    if (voucherMatches) {
      voucherMatches.forEach(voucherXml => {
        const voucher = {};
        
        // Extract basic fields
        voucher.date = extractField(voucherXml, 'DATE');
        voucher.voucherType = extractField(voucherXml, 'VOUCHERTYPENAME');
        voucher.voucherNumber = extractField(voucherXml, 'VOUCHERNUMBER');
        voucher.narration = extractField(voucherXml, 'NARRATION');
        voucher.partyName = extractField(voucherXml, 'PARTYNAME');
        voucher.amount = extractField(voucherXml, 'AMOUNT');
        
        // Extract ledger entries
        const ledgerEntryMatches = voucherXml.match(/<ALLLEDGERENTRIES\.LIST[^>]*>[\s\S]*?<\/ALLLEDGERENTRIES\.LIST>/g);
        if (ledgerEntryMatches) {
          voucher.ledgerEntries = ledgerEntryMatches.map(entryXml => ({
            ledgerName: extractField(entryXml, 'LEDGERNAME'),
            amount: extractField(entryXml, 'AMOUNT'),
            ledgerType: extractField(entryXml, 'ISDEEMEDPOSITIVE')
          }));
        }
        
        vouchers.push(voucher);
      });
    }
    
    return vouchers;
  } catch (error) {
    console.error('Error parsing XML response:', error);
    return [];
  }
}

/**
 * Helper function to extract field value from XML
 */
function extractField(xml, fieldName) {
  const regex = new RegExp(`<${fieldName}[^>]*>([^<]*)</${fieldName}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Save data to JSON file
 */
function saveToFile(data, filename) {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const fullFilename = `voucher-data-${timestamp}-${filename}`;
  const filepath = path.join(__dirname, fullFilename);
  
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
  console.log(`💾 Data saved to: ${fullFilename}`);
  return filepath;
}

/**
 * Main function to fetch voucher data
 */
async function fetchVoucherData() {
  console.log('🚀 Starting Tally voucher data fetcher...\n');
  
  try {
    // Check if Tally is online
    console.log('🔍 Checking Tally connection...');
    const pingXml = `<ENVELOPE><HEADER><TALLYREQUEST>Export Data</TALLYREQUEST></HEADER><BODY><EXPORTDATA><REQUESTDESC><REPORTNAME>List of Companies</REPORTNAME></REQUESTDESC></EXPORTDATA></BODY></ENVELOPE>`;
    await sendToTally(pingXml);
    console.log('✅ Tally is online and responding\n');
    
    // Configuration for data fetch
    const options = {
      company: process.env.TALLY_COMPANY || '',
      fromDate: process.env.TALLY_FROM_DATE || '',
      toDate: process.env.TALLY_TO_DATE || '',
      voucherType: process.env.TALLY_VOUCHER_TYPE || ''
    };
    
    console.log('📋 Fetch Configuration:');
    console.log(`   Company: ${options.company || 'Default'}`);
    console.log(`   From Date: ${options.fromDate || 'All'}`);
    console.log(`   To Date: ${options.toDate || 'All'}`);
    console.log(`   Voucher Type: ${options.voucherType || 'All'}\n`);
    
    // Fetch detailed voucher data
    console.log('📊 Fetching detailed voucher data...');
    const detailedXml = buildDetailedVoucherXml(options);
    const detailedResponse = await sendToTally(detailedXml);
    const detailedVouchers = parseVoucherResponse(detailedResponse);
    console.log(`✅ Found ${detailedVouchers.length} detailed vouchers\n`);
    
    // Prepare final data structure
    const voucherData = {
      metadata: {
        fetchTimestamp: new Date().toISOString(),
        totalVouchers: detailedVouchers.length,
        company: options.company || 'Default',
        dateRange: {
          from: options.fromDate || null,
          to: options.toDate || null
        },
        voucherType: options.voucherType || 'All',
        note: 'Complete voucher data fetched successfully'
      },
      vouchers: detailedVouchers,
      summary: generateVoucherSummary(detailedVouchers)
    };
    
    // Save to file
    const detailedFile = saveToFile(voucherData, 'detailed.json');
    
    // Display summary
    console.log('\n📈 VOUCHER DATA SUMMARY:');
    console.log('=========================');
    console.log(`Total Vouchers: ${voucherData.metadata.totalVouchers}`);
    console.log(`Company: ${voucherData.metadata.company}`);
    console.log(`Date Range: ${options.fromDate || 'All'} to ${options.toDate || 'All'}`);
    console.log(`Voucher Type: ${options.voucherType || 'All'}`);
    
    if (voucherData.summary.byType) {
      console.log('\nVouchers by Type:');
      Object.entries(voucherData.summary.byType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
    }
    
    console.log(`\nWith Narration: ${voucherData.summary.withNarration}`);
    console.log(`With Party Name: ${voucherData.summary.withPartyName}`);
    console.log(`With Ledger Entries: ${voucherData.summary.withLedgerEntries}`);
    
    console.log('\n📁 File Created:');
    console.log(`  - ${path.basename(detailedFile)}`);
    
    console.log('\n✅ Voucher data fetch completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Error fetching voucher data:', error.message);
    process.exit(1);
  }
}

/**
 * Generate summary statistics
 */
function generateVoucherSummary(vouchers) {
  const summary = {
    byType: {},
    withNarration: 0,
    withPartyName: 0,
    withLedgerEntries: 0,
    totalVouchers: vouchers.length
  };
  
  vouchers.forEach(voucher => {
    // Count by type
    const type = voucher.voucherType || 'Unknown';
    summary.byType[type] = (summary.byType[type] || 0) + 1;
    
    // Count features
    if (voucher.narration) {
      summary.withNarration++;
    }
    if (voucher.partyName) {
      summary.withPartyName++;
    }
    if (voucher.ledgerEntries && voucher.ledgerEntries.length > 0) {
      summary.withLedgerEntries++;
    }
  });
  
  return summary;
}

// Run the script
if (require.main === module) {
  fetchVoucherData();
}

module.exports = {
  fetchVoucherData,
  buildDetailedVoucherXml,
  parseVoucherResponse
};
