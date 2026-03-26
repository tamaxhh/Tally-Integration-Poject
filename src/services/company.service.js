const { getAllMasters } = require('../services/master.service');
const { getAllTransactions } = require('../services/voucher.service');
const { getAllReports } = require('../services/report.service');

async function getCompleteCompanyData(company, from, to) {
  console.log(`🔍 DEBUG - Fetching complete company data for: ${company}`);
  
  try {
    const [masters, transactions, reports] = await Promise.all([
      getAllMasters(company),
      getAllTransactions(company, from, to),
      getAllReports(company)
    ]);

    return {
      success: true,
      company_info: {
        name: company,
        fetched_at: new Date(),
        note: 'Complete company data extracted from Tally'
      },
      masters,
      transactions,
      reports
    };
  } catch (error) {
    console.error('❌ ERROR - Failed to fetch company data:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = { getCompleteCompanyData };
