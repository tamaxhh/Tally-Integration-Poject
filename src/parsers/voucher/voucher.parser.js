/**
 * src/xml/parser/voucher.parser.js
 *
 * VOUCHER DATA STRUCTURE IN TALLY:
 * ---------------------------------
 * A voucher is a transaction. Each voucher has:
 * - A header: date, voucher type, voucher number, narration
 * - Ledger entries: the debit/credit legs of the transaction
 *
 * In double-entry accounting, every voucher MUST balance:
 * sum(debits) === sum(credits)
 *
 * TALLY VOUCHER XML (simplified):
 * ---------------------------------
 * <VOUCHER VCHTYPE="Sales" ACTION="Create">
 *   <DATE>20230401</DATE>
 *   <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
 *   <VOUCHERNUMBER>Sal-001</VOUCHERNUMBER>
 *   <PARTYLEDGERNAME>Customer ABC</PARTYLEDGERNAME>
 *   <NARRATION>Invoice for April services</NARRATION>
 *   <ALLLEDGERENTRIES.LIST>
 *     <LEDGERNAME>Customer ABC</LEDGERNAME>
 *     <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>   ← Debit if Yes, Credit if No
 *     <AMOUNT>-10000.00</AMOUNT>                  ← Negative = debit in Tally's convention
 *   </ALLLEDGERENTRIES.LIST>
 *   <ALLLEDGERENTRIES.LIST>
 *     <LEDGERNAME>Sales Account</LEDGERNAME>
 *     <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
 *     <AMOUNT>10000.00</AMOUNT>
 *   </ALLLEDGERENTRIES.LIST>
 * </VOUCHER>
 *
 * IMPORTANT: Tally uses a confusing sign convention.
 * Positive AMOUNT = credit side. Negative = debit side.
 * ISDEEMEDPOSITIVE tells you which side of the entry this is.
 * We normalise this into explicit debit/credit amounts.
 */

'use strict';

const { parseXml, parseAmount, parseTallyDate, safeGet, ensureArray } = require('./index');

/**
 * Normalise a single ledger entry within a voucher.
 * Each entry is one leg of the double-entry transaction.
 */
function normaliseLedgerEntry(entry) {
  const amount = parseAmount(entry.AMOUNT);
  const isDeemedPositive = entry.ISDEEMEDPOSITIVE === 'Yes';

  return {
    ledgerName: entry.LEDGERNAME || '',
    // Normalise to explicit debit/credit — easier to work with than Tally's sign convention
    debitAmount: isDeemedPositive ? Math.abs(amount || 0) : 0,
    creditAmount: !isDeemedPositive ? Math.abs(amount || 0) : 0,
    // Keep raw amount for reconciliation
    rawAmount: amount,
  };
}

/**
 * Normalise a raw Tally voucher object into a clean API response shape.
 */
function normaliseVoucher(rawVoucher) {
  const ledgerEntries = [
    ...ensureArray(rawVoucher['ALLLEDGERENTRIES.LIST']),
    ...ensureArray(rawVoucher['LEDGERENTRIES.LIST']),
  ].map(normaliseLedgerEntry);

  const totalDebit = ledgerEntries.reduce((sum, e) => sum + e.debitAmount, 0);
  const totalCredit = ledgerEntries.reduce((sum, e) => sum + e.creditAmount, 0);

  return {
    voucherNumber: rawVoucher.VOUCHERNUMBER || '',
    date: parseTallyDate(rawVoucher.DATE),
    voucherType: rawVoucher.VOUCHERTYPENAME || rawVoucher['@_VCHTYPE'] || '',
    partyLedger: rawVoucher.PARTYLEDGERNAME || '',
    narration: rawVoucher.NARRATION || '',
    // The net amount of the transaction (should equal totalCredit = totalDebit for balanced entries)
    amount: parseAmount(rawVoucher.AMOUNT) || totalCredit,
    totalDebit: parseFloat(totalDebit.toFixed(2)),
    totalCredit: parseFloat(totalCredit.toFixed(2)),
    isBalanced: Math.abs(totalDebit - totalCredit) < 0.01, // Allow 1 paisa rounding tolerance
    ledgerEntries,
    // Preserve Tally's internal GUID for idempotent upserts to the database
    tallyGuid: rawVoucher['@_GUID'] || rawVoucher.GUID || null,
  };
}

/**
 * Parse a Tally "Day Book" XML response into an array of vouchers.
 *
 * @param {string} xmlString - Raw XML from Tally
 * @returns {{ vouchers: object[], total: number }}
 */
function parseVoucherList(xmlString) {
  const parsed = parseXml(xmlString);

  const requestData = safeGet(parsed, 'ENVELOPE.BODY.EXPORTDATA.REQUESTDATA');
  const tallyMessages = ensureArray(safeGet(requestData, 'TALLYMESSAGE'));

  const vouchers = [];

  for (const message of tallyMessages) {
    const rawVouchers = ensureArray(message.VOUCHER);
    for (const raw of rawVouchers) {
      if (raw && (raw.VOUCHERNUMBER || raw.DATE)) {
        vouchers.push(normaliseVoucher(raw));
      }
    }
  }

  // Sort by date ascending — Tally doesn't guarantee order
  vouchers.sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return new Date(a.date) - new Date(b.date);
  });

  return {
    vouchers,
    total: vouchers.length,
  };
}

module.exports = {
  parseVoucherList,
  normaliseVoucher,
  normaliseLedgerEntry,
};
