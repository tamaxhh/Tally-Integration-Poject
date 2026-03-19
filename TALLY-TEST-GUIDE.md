# Step-by-Step Guide: Test Tally Prime Data Fetch (Beginner)

## Prerequisites
1. **Tally Prime running:**
   - Open Tally Prime on your Windows PC
   - Go to Help → Developer Reference → Enable ODBC/XML port (default: 9000)
   - Select company with data

2. **API running:** Terminal shows `docker-compose up -d` complete, `docker-compose ps` shows `Up (healthy)`

## Step 1: Test API Health
```
curl http://localhost:3000/health -UseBasicParsing
```
Expected: `{"status":"healthy"}`

## Step 2: Open UI Dashboard
```
start index.html
```
Browser opens dashboard showing live API status.

## Step 3: Test Tally Connection (when implemented)
```
curl "http://localhost:3000/api/v1/ledgers?apiKey=dev-key-local-only" -UseBasicParsing
```
Expected: Your ledger data JSON (company, groups, ledgers).

## Step 4: Check Logs Live
```
docker-compose logs -f app
```
See connection attempts/data/errors.

## Current Status
- ✅ Docker/API healthy
- ✅ UI dashboard working
- ⏳ Tally fetching endpoints next (add /ledgers, /vouchers)

## Troubleshooting
- Tally not responding? Check Tally port 9000, company loaded
- API down? `docker-compose restart app`
- Need endpoints? Ask "implement ledger endpoint"

**Ready? Reply "implement Tally ledgers endpoint" for next code!**
