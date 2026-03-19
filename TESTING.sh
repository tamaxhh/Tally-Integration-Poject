# Tally Integration API — Testing Guide
# =========================================
# This file contains sample curl commands and Postman collection snippets
# for testing every endpoint. Use these to verify your setup works.

# ============================================================
# SETUP
# ============================================================

# Set these variables before running any commands:
export BASE_URL="http://localhost:3000"
export API_KEY="dev-key-1234"    # Must match API_KEYS in your .env

# ============================================================
# HEALTH CHECKS
# ============================================================

# 1. Basic liveness (no auth required)
curl -s "$BASE_URL/health/live" | jq .

# Expected response:
# {
#   "status": "alive",
#   "timestamp": "2024-04-01T10:30:00.000Z"
# }

# 2. Full health check — shows Tally + Redis status
curl -s "$BASE_URL/health" | jq .

# Expected response (Tally online):
# {
#   "status": "healthy",
#   "uptime": 42.5,
#   "responseTime": 85,
#   "checks": {
#     "tally": { "status": "healthy", "breaker": { "state": "CLOSED", "failures": 0 } },
#     "redis": { "status": "healthy" }
#   }
# }

# Expected response (Tally offline):
# {
#   "status": "degraded",
#   "checks": {
#     "tally": { "status": "unhealthy", "reason": "Circuit breaker is OPEN" },
#     ...
#   }
# }

# ============================================================
# LEDGER ENDPOINTS
# ============================================================

# 3. Get all ledgers
curl -s "$BASE_URL/api/v1/ledgers" \
  -H "x-api-key: $API_KEY" | jq .

# Expected:
# {
#   "success": true,
#   "data": [
#     {
#       "name": "Customer ABC Ltd",
#       "parent": "Sundry Debtors",
#       "openingBalance": 30000,
#       "closingBalance": 50000,
#       "isBillWise": true,
#       "gstin": "27AABCU9603R1ZX"
#     }
#   ],
#   "meta": { "total": 42, "page": 1, "limit": 50, "totalPages": 1, "fromCache": false }
# }

# 4. Get ledgers with pagination
curl -s "$BASE_URL/api/v1/ledgers?page=1&limit=10" \
  -H "x-api-key: $API_KEY" | jq .meta

# 5. Get ledgers for a specific company
curl -s "$BASE_URL/api/v1/ledgers?company=My+Company+Ltd" \
  -H "x-api-key: $API_KEY" | jq .

# 6. Get a single ledger by name
# IMPORTANT: URL-encode the ledger name (spaces → %20 or +)
LEDGER_NAME=$(python3 -c "import urllib.parse; print(urllib.parse.quote('Customer ABC Ltd'))")
curl -s "$BASE_URL/api/v1/ledgers/$LEDGER_NAME" \
  -H "x-api-key: $API_KEY" | jq .

# Or with curl's --data-urlencode (but for path params, manual encoding is clearer):
curl -s "$BASE_URL/api/v1/ledgers/Customer%20ABC%20Ltd" \
  -H "x-api-key: $API_KEY" | jq .

# 7. Force sync (bypass cache)
curl -s -X POST "$BASE_URL/api/v1/ledgers/sync" \
  -H "x-api-key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"company": ""}' | jq .

# ============================================================
# VOUCHER ENDPOINTS
# ============================================================

# 8. Get vouchers for April 2024 (REQUIRED: fromDate + toDate)
curl -s "$BASE_URL/api/v1/vouchers?fromDate=2024-04-01&toDate=2024-04-30" \
  -H "x-api-key: $API_KEY" | jq .

# 9. Get Sales vouchers only
curl -s "$BASE_URL/api/v1/vouchers?fromDate=2024-04-01&toDate=2024-04-30&voucherType=Sales" \
  -H "x-api-key: $API_KEY" | jq '.data[] | {number: .voucherNumber, date: .date, amount: .amount}'

# 10. Get voucher summary (totals by type)
curl -s "$BASE_URL/api/v1/vouchers/summary?fromDate=2024-04-01&toDate=2024-04-30" \
  -H "x-api-key: $API_KEY" | jq .

# Expected:
# {
#   "success": true,
#   "data": {
#     "Sales":   { "count": 45, "totalAmount": 450000 },
#     "Payment": { "count": 12, "totalAmount": 120000 },
#     "Receipt": { "count": 8,  "totalAmount": 95000 }
#   }
# }

# 11. Get a single voucher
curl -s "$BASE_URL/api/v1/vouchers/Sal-001" \
  -H "x-api-key: $API_KEY" | jq .

# 12. Test date validation (should return 400)
curl -s "$BASE_URL/api/v1/vouchers?fromDate=2024-01-01&toDate=2025-06-01" \
  -H "x-api-key: $API_KEY" | jq .error  # "ValidationError" — range > 366 days

# ============================================================
# REPORT ENDPOINTS
# ============================================================

# 13. Trial Balance
curl -s "$BASE_URL/api/v1/reports/trial-balance?fromDate=2024-04-01&toDate=2024-03-31" \
  -H "x-api-key: $API_KEY" | jq '.data.totals'

# 14. Profit & Loss
curl -s "$BASE_URL/api/v1/reports/profit-loss?fromDate=2024-04-01&toDate=2025-03-31" \
  -H "x-api-key: $API_KEY" | jq '.data.summary'

# Expected:
# {
#   "totalIncome": 1250000,
#   "totalExpense": 875000,
#   "netProfit": 375000,
#   "isProfitable": true
# }

# 15. Balance Sheet
curl -s "$BASE_URL/api/v1/reports/balance-sheet?fromDate=2024-04-01&toDate=2025-03-31" \
  -H "x-api-key: $API_KEY" | jq '.data.summary'

# ============================================================
# ERROR SCENARIOS — VERIFY THESE WORK CORRECTLY
# ============================================================

# 16. Missing API key → 401
curl -s "$BASE_URL/api/v1/ledgers" | jq .error

# 17. Wrong API key → 403
curl -s "$BASE_URL/api/v1/ledgers" -H "x-api-key: wrong" | jq .error

# 18. Invalid pagination → 400
curl -s "$BASE_URL/api/v1/ledgers?limit=9999" -H "x-api-key: $API_KEY" | jq .

# 19. Non-existent ledger → 404
curl -s "$BASE_URL/api/v1/ledgers/NoSuchLedger" -H "x-api-key: $API_KEY" | jq .

# 20. Test rate limiting (run 110+ times quickly)
for i in $(seq 1 110); do
  curl -s -o /dev/null -w "%{http_code}\n" \
    "$BASE_URL/api/v1/ledgers" -H "x-api-key: $API_KEY"
done
# After ~100 requests: should see 429 Too Many Requests

# ============================================================
# POSTMAN COLLECTION
# ============================================================
# Import this JSON into Postman:

cat << 'POSTMAN_JSON'
{
  "info": {
    "name": "Tally Integration API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    { "key": "baseUrl",  "value": "http://localhost:3000" },
    { "key": "apiKey",   "value": "dev-key-1234" },
    { "key": "fromDate", "value": "2024-04-01" },
    { "key": "toDate",   "value": "2024-04-30" }
  ],
  "item": [
    {
      "name": "Health",
      "item": [
        {
          "name": "Full health check",
          "request": { "method": "GET", "url": "{{baseUrl}}/health" }
        },
        {
          "name": "Liveness probe",
          "request": { "method": "GET", "url": "{{baseUrl}}/health/live" }
        }
      ]
    },
    {
      "name": "Ledgers",
      "item": [
        {
          "name": "Get all ledgers",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/api/v1/ledgers",
            "header": [{ "key": "x-api-key", "value": "{{apiKey}}" }]
          }
        },
        {
          "name": "Get ledger by name",
          "request": {
            "method": "GET",
            "url": "{{baseUrl}}/api/v1/ledgers/Customer%20ABC%20Ltd",
            "header": [{ "key": "x-api-key", "value": "{{apiKey}}" }]
          }
        }
      ]
    },
    {
      "name": "Vouchers",
      "item": [
        {
          "name": "Get vouchers by date range",
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{baseUrl}}/api/v1/vouchers?fromDate={{fromDate}}&toDate={{toDate}}",
              "query": [
                { "key": "fromDate", "value": "{{fromDate}}" },
                { "key": "toDate",   "value": "{{toDate}}" }
              ]
            },
            "header": [{ "key": "x-api-key", "value": "{{apiKey}}" }]
          }
        },
        {
          "name": "Voucher summary",
          "request": {
            "method": "GET",
            "url": {
              "raw": "{{baseUrl}}/api/v1/vouchers/summary?fromDate={{fromDate}}&toDate={{toDate}}",
              "query": [
                { "key": "fromDate", "value": "{{fromDate}}" },
                { "key": "toDate",   "value": "{{toDate}}" }
              ]
            },
            "header": [{ "key": "x-api-key", "value": "{{apiKey}}" }]
          }
        }
      ]
    }
  ]
}
POSTMAN_JSON
