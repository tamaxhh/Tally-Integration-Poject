# Groups API Documentation

## Overview

The Groups API provides complete access to Tally groups (chart of accounts) data with comprehensive functionality including hierarchy analysis, search, and export capabilities.

## Base URL
```
http://localhost:3000/api/v1/groups
```

## Authentication
All API endpoints require authentication (unless explicitly configured otherwise).

## Endpoints

### 1. Get All Groups

**GET** `/api/v1/groups`

Fetch all groups from Tally with complete details including hierarchy and behaviour.

#### Query Parameters
- `company` (string, optional): Tally company name
- `bypassCache` (boolean, optional): Force fresh fetch from Tally

#### Response
```json
{
  "success": true,
  "data": [
    {
      "name": "Bank Accounts",
      "guid": "guid-value",
      "parent": "Current Assets",
      "isGroup": true,
      "isDeemedPositive": false,
      "behaviour": "BankAccounts",
      "isPrimary": false,
      "sortAllocation": "Ascending",
      "isCostCentreOn": false,
      "isCostCentreCreatedOn": false
    }
  ],
  "meta": {
    "total": 30,
    "fetchTimestamp": "2026-03-27T11:19:00.000Z",
    "company": "Default",
    "note": "Groups data fetched using Tally XML API",
    "fromCache": false,
    "fetchedAt": "2026-03-27T11:19:00.000Z",
    "endpoint": "/api/v1/groups"
  }
}
```

### 2. Get Groups Hierarchy

**GET** `/api/v1/groups/hierarchy`

Fetch groups organized in hierarchical tree structure.

#### Query Parameters
- `company` (string, optional): Tally company name
- `bypassCache` (boolean, optional): Force fresh fetch from Tally

#### Response
```json
{
  "success": true,
  "data": [
    {
      "name": "Assets",
      "guid": "guid-value",
      "parent": "",
      "isPrimary": true,
      "children": [
        {
          "name": "Current Assets",
          "guid": "guid-value",
          "parent": "Assets",
          "isPrimary": false,
          "children": [
            {
              "name": "Bank Accounts",
              "guid": "guid-value",
              "parent": "Current Assets",
              "isPrimary": false,
              "children": []
            }
          ]
        }
      ]
    }
  ],
  "meta": {
    "totalGroups": 30,
    "maxDepth": 3,
    "topLevelGroups": ["Assets", "Liabilities", "Income"],
    "fromCache": false,
    "fetchedAt": "2026-03-27T11:19:00.000Z",
    "endpoint": "/api/v1/groups/hierarchy"
  }
}
```

### 3. Get Single Group

**GET** `/api/v1/groups/:groupName`

Fetch a specific group by name.

#### Path Parameters
- `groupName` (string): Name of the group to fetch

#### Query Parameters
- `company` (string, optional): Tally company name
- `bypassCache` (boolean, optional): Force fresh fetch from Tally

#### Response
```json
{
  "success": true,
  "data": {
    "name": "Bank Accounts",
    "guid": "guid-value",
    "parent": "Current Assets",
    "isGroup": true,
    "isDeemedPositive": false,
    "behaviour": "BankAccounts",
    "isPrimary": false,
    "sortAllocation": "Ascending"
  },
  "meta": {
    "fromCache": false,
    "fetchedAt": "2026-03-27T11:19:00.000Z",
    "endpoint": "/api/v1/groups/Bank Accounts"
  }
}
```

#### Error Response (404)
```json
{
  "success": false,
  "error": "Group not found",
  "message": "Group \"Unknown Group\" not found",
  "meta": {
    "fetchedAt": "2026-03-27T11:19:00.000Z",
    "endpoint": "/api/v1/groups/Unknown Group"
  }
}
```

### 4. Search Groups

**GET** `/api/v1/groups?search=query`

Search groups by name (case-insensitive partial match).

#### Query Parameters
- `search` (string): Search query
- `company` (string, optional): Tally company name
- `bypassCache` (boolean, optional): Force fresh fetch from Tally

#### Response
```json
{
  "success": true,
  "data": [
    {
      "name": "Bank Accounts",
      "guid": "guid-value",
      "parent": "Current Assets",
      "isGroup": true,
      "isDeemedPositive": false,
      "behaviour": "BankAccounts",
      "isPrimary": false
    }
  ],
  "meta": {
    "total": 1,
    "query": "bank",
    "fromCache": false,
    "fetchedAt": "2026-03-27T11:19:00.000Z",
    "endpoint": "/api/v1/groups"
  }
}
```

### 5. Get Groups by Parent

**GET** `/api/v1/groups?parent=parentName`

Fetch all groups that have the specified parent.

#### Query Parameters
- `parent` (string): Parent group name
- `company` (string, optional): Tally company name
- `bypassCache` (boolean, optional): Force fresh fetch from Tally

#### Response
```json
{
  "success": true,
  "data": [
    {
      "name": "Bank Accounts",
      "guid": "guid-value",
      "parent": "Current Assets",
      "isGroup": true,
      "isDeemedPositive": false,
      "behaviour": "BankAccounts",
      "isPrimary": false
    }
  ],
  "meta": {
    "total": 3,
    "parent": "Current Assets",
    "fromCache": false,
    "fetchedAt": "2026-03-27T11:19:00.000Z",
    "endpoint": "/api/v1/groups"
  }
}
```

### 6. Export Groups Data

**POST** `/api/v1/groups/export`

Export groups data to JSON file.

#### Request Body
```json
{
  "company": "My Company",
  "outputDir": "./exports",
  "bypassCache": false
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "filepath": "./exports/groups-data-2026-03-27.json",
    "filename": "groups-data-2026-03-27.json",
    "total": 30,
    "company": "My Company"
  },
  "meta": {
    "fetchedAt": "2026-03-27T11:19:00.000Z",
    "endpoint": "/api/v1/groups/export"
  }
}
```

### 7. Clear Groups Cache

**DELETE** `/api/v1/groups/cache`

Clear cached groups data.

#### Query Parameters
- `company` (string, optional): Specific company cache to clear (clears all if not specified)

#### Response
```json
{
  "success": true,
  "message": "Groups cache cleared successfully",
  "meta": {
    "company": "all",
    "fetchedAt": "2026-03-27T11:19:00.000Z",
    "endpoint": "/api/v1/groups/cache"
  }
}
```

## Data Model

### Group Object

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Group name |
| `guid` | string | Unique identifier from Tally |
| `parent` | string | Parent group name |
| `isGroup` | boolean | Whether this is a group (always true for groups) |
| `isDeemedPositive` | boolean | Accounting classification |
| `behaviour` | string | Tally behavior classification |
| `isPrimary` | boolean | Whether this is a primary group |
| `sortAllocation` | string | Sorting order preference |
| `isCostCentreOn` | boolean | Cost centre enabled |
| `isCostCentreCreatedOn` | boolean | Cost centre created |

## Behaviour Categories

Groups are automatically categorized by behaviour:

- **income**: Income and revenue groups
- **expense**: Expense and cost groups  
- **asset**: Asset groups (banks, cash, debtors)
- **liability**: Liability groups (creditors, capital)
- **equity**: Equity groups
- **other**: Uncategorized groups

## Hierarchy Analysis

The hierarchy endpoint provides:

- **maxDepth**: Maximum hierarchy depth
- **topLevelGroups**: Root level groups
- **tree structure**: Nested parent-child relationships

## Caching

- Groups data is cached for performance
- Cache TTL: Configurable (default 5 minutes)
- Use `bypassCache=true` to force fresh fetch
- Use cache clear endpoint to invalidate manually

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "meta": {
    "fetchedAt": "2026-03-27T11:19:00.000Z",
    "endpoint": "/api/v1/groups"
  }
}
```

## Common Error Codes

- **400**: Bad Request (invalid parameters)
- **404**: Not Found (group not found)
- **500**: Internal Server Error (Tally connection issues)

## Usage Examples

### Basic Groups Fetch
```bash
curl -X GET "http://localhost:3000/api/v1/groups"
```

### Search Groups
```bash
curl -X GET "http://localhost:3000/api/v1/groups?search=bank"
```

### Get Hierarchy
```bash
curl -X GET "http://localhost:3000/api/v1/groups/hierarchy?company=My%20Company"
```

### Export Data
```bash
curl -X POST "http://localhost:3000/api/v1/groups/export" \
  -H "Content-Type: application/json" \
  -d '{"company": "My Company", "outputDir": "./exports"}'
```

### Clear Cache
```bash
curl -X DELETE "http://localhost:3000/api/v1/groups/cache"
```

## Integration with Complete Data

Groups data is included in the complete data export:

```bash
curl -X GET "http://localhost:3000/api/v1/complete-data"
```

The response includes groups in the `masters.groups` array with full hierarchy and analysis.
