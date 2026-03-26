const { parseXml, safeGet, ensureArray } = require('../parsers/core.parser');

// Fetch all vouchers with date filtering
async function getAllVouchers(company, from, to) {
  const { buildMasterXml } = require('../parsers/master.parser');
  
  // Build XML for all vouchers with date range
  const xml = buildMasterXml({ 
    type: 'Vouchers', 
    company 
  });
  
  const { sendToTally } = require('../../utils/httpClient');
  
  try {
    const response = await sendToTally(xml);
    const result = parseXml(response.data);
    
    // Extract vouchers array
    const vouchers = ensureArray(safeGet(result, 'ENVELOPE.BODY.DATA.COLLECTION.VOUCHER'));
    
    // Filter by date range if provided
    let filteredVouchers = vouchers;
    if (from || to) {
      filteredVouchers = vouchers.filter(voucher => {
        const voucherDate = parseTallyDate(voucher.DATE);
        const fromDate = from ? new Date(from) : null;
        const toDate = to ? new Date(to) : null;
        
        return (!fromDate || !toDate || (voucherDate >= fromDate && voucherDate <= toDate));
      });
    }
    
    console.log(`🔍 DEBUG - Fetched ${vouchers.length} vouchers (${filteredVouchers.length} in date range)`);
    
    return {
      success: true,
      total: vouchers.length,
      vouchers: filteredVouchers,
      requestType: 'Vouchers',
      dateRange: { from, to },
      processingTime: Date.now() - startTime
    };
  } catch (error) {
    console.error('❌ ERROR - Failed to fetch vouchers:', error);
    return {
      success: false,
      error: error.message,
      requestType: 'Vouchers'
    };
  }
}

module.exports = { getAllVouchers };
