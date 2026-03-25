/**
 * src/xml/parser/ledger.parser.js
 *
 * DOMAIN-SPECIFIC PARSER: LEDGERS
 * ================================
 * This file takes the raw parsed XML object from index.js and extracts
 * ledger-specific data, normalising it into a clean, typed JSON structure.
 *
 * SEPARATION OF CONCERNS:
 * ------------------------
 * - index.js  → knows about XML parsing in general
 * - This file → knows about Tally's ledger data structure specifically
 *
 * This means if Tally changes its XML schema for ledgers, you only update this file.
 *
 * TALLY LEDGER XML STRUCTURE (simplified):
 * -----------------------------------------
 * <ENVELOPE>
 *   <BODY>
 *     <EXPORTDATA>
 *       <REQUESTDATA>
 *         <TALLYMESSAGE xmlns:UDF="TallyUDF">
 *           <GROUP RESERVEDNAME="">
 *             <NAME>Sundry Debtors</NAME>
 *             ...
 *             <LEDGER NAME="Customer ABC">
 *               <NAME>Customer ABC</NAME>
 *               <PARENT>Sundry Debtors</PARENT>
 *               <CLOSINGBALANCE>50000.00</CLOSINGBALANCE>
 *               <OPENINGBALANCE>30000.00</OPENINGBALANCE>
 *             </LEDGER>
 *           </GROUP>
 *         </TALLYMESSAGE>
 *       </REQUESTDATA>
 *     </EXPORTDATA>
 *   </BODY>
 * </ENVELOPE>
 */

'use strict';

const { parseXml, parseAmount, safeGet, ensureArray } = require('./index');

/**
 * The canonical shape of a ledger in our system.
 * Every ledger returned by this API has exactly this structure.
 * No raw Tally fields leak to the API consumer.
 */
function normaliseLedger(rawLedger) {
  // Raw Tally fields have ALL CAPS names — we translate to camelCase
  return {
    name: rawLedger.NAME || rawLedger['@_NAME'] || '',
    parent: rawLedger.PARENT || '',       // Parent group (e.g. "Sundry Debtors")
    openingBalance: parseAmount(rawLedger.OPENINGBALANCE),
    closingBalance: parseAmount(rawLedger.CLOSINGBALANCE),
    // ISBILLWISEON: Tally uses "Yes"/"No" strings for booleans
    isBillWise: rawLedger.ISBILLWISEON === 'Yes',
    isRevenue: rawLedger.ISREVENUE === 'Yes',
    taxType: rawLedger.TAXTYPE || null,
    gstRegistrationType: rawLedger.GSTREGISTRATIONTYPE || null,
    // Phone/address if available (mostly for party ledgers)
    phone: rawLedger.LEDPHONE || null,
    email: rawLedger.EMAIL || null,
    // GST details (common in Indian accounting)
    gstin: rawLedger.PARTYGSTIN || null,
    panItNo: rawLedger.PANITNO || null,
    // Preserve the original Tally name as a stable identifier
    tallyName: rawLedger.NAME || rawLedger['@_NAME'] || '',
  };
}

/**
 * Parse a Tally "List of Accounts" XML response into an array of ledger objects.
 *
 * @param {string} xmlString - Raw XML from Tally
 * @returns {{ ledgers: object[], total: number }}
 */
function parseLedgerList(xmlString) {
  const parsed = parseXml(xmlString);

  // Navigate the Tally XML structure to find ledger data
  // The path varies slightly between Tally versions — we try common paths
  const requestData = safeGet(parsed, 'ENVELOPE.BODY.EXPORTDATA.REQUESTDATA');
  const tallyMessages = ensureArray(safeGet(requestData, 'TALLYMESSAGE'));

  const ledgers = [];

  for (const message of tallyMessages) {
    // Ledgers can be nested inside GROUP elements
    const groups = ensureArray(message.GROUP);

    for (const group of groups) {
      // Each group can contain multiple ledgers
      const rawLedgers = ensureArray(group.LEDGER);
      for (const rawLedger of rawLedgers) {
        if (rawLedger && rawLedger.NAME) {
          ledgers.push(normaliseLedger(rawLedger));
        }
      }
    }

    // Some Tally responses put ledgers directly in TALLYMESSAGE (not in groups)
    const directLedgers = ensureArray(message.LEDGER);
    for (const rawLedger of directLedgers) {
      if (rawLedger && rawLedger.NAME) {
        ledgers.push(normaliseLedger(rawLedger));
      }
    }
  }

  return {
    ledgers,
    total: ledgers.length,
  };
}

/**
 * Parse a single ledger XML response.
 *
 * @param {string} xmlString
 * @returns {object|null} Single ledger object or null if not found
 */
function parseSingleLedger(xmlString) {
  const { ledgers } = parseLedgerList(xmlString);
  return ledgers.length > 0 ? ledgers[0] : null;
}

module.exports = {
  parseLedgerList,
  parseSingleLedger,
  normaliseLedger,
};
