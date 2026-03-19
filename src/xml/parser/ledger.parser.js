'use strict';

// Re-export ledger parser functions from the root parser.test.js
const { parseLedgerList } = require('../../../parser.test.js');

module.exports = {
  parseLedgerList,
};
