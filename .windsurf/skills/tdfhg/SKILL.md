---
name: tdfhg
description: A brief description, shown to the model to help it understand when to use this skill
---

Instructions for the skill go here. Provide relative paths to other resources in the skill directory as needed.

# 🚀 Tally XML Integration Rules & Debugging Guide

## 🎯 Purpose

This document defines **strict rules and guardrails** for interacting with Tally Prime via XML API.

These rules are derived from:

* Official Tally documentation
* Real-world debugging failures
* Observed agent mistakes

---

# 🧠 Core Concept

Tally XML works on **two distinct engines**:

| Engine            | TYPE       | Used For                    |
| ----------------- | ---------- | --------------------------- |
| Collection Engine | COLLECTION | Masters & Transactions      |
| Report Engine     | DATA       | Trial Balance, P&L, Reports |

---

# 🚨 Critical Rules (MUST FOLLOW)

---

## 1. ❌ Do NOT Assume Collection Names

Tally does NOT expose SQL-like tables.

### ❌ Wrong

```xml
<ID>AllGroups</ID>
<ID>AllStockItems</ID>
```

### ✅ Correct

```xml
<ID>Collection</ID>
```

Collections must be defined via **TDL**

---

## 2. ✅ TYPE and ID Must Match

| TYPE       | ID          |
| ---------- | ----------- |
| COLLECTION | Collection  |
| DATA       | Report Name |

### ❌ Wrong

```xml
<TYPE>COLLECTION</TYPE>
<ID>Trial Balance</ID>
```

### ✅ Correct

```xml
<TYPE>DATA</TYPE>
<ID>Trial Balance</ID>
```

---

## 3. 🧠 COLLECTION NAME is NOT Real

```xml
<COLLECTION NAME="Anything">
```

* This is just an alias
* Tally ignores the name for lookup
* Only `<TYPE>` matters

---

## 4. ❌ Do NOT Create Fake Entities

Valid Tally Object Types:

* Ledger
* Group
* Voucher
* StockItem

### ❌ Invalid

* Company
* AllGroups
* AllStockItems

---

## 5. 🚫 Reports Are NOT Collections

### ❌ Never do:

```xml
<COLLECTION NAME="Trial Balance">
```

### ✅ Always:

```xml
<TYPE>DATA</TYPE>
<ID>Trial Balance</ID>
```

---

## 6. ⚠️ Empty Response = Failure

```json
{ "success": true, "data": [] }
```

This means:

* Wrong TYPE
* Wrong ID
* Invalid object

---

## 7. 📅 Date Format is Strict

### ❌ Wrong

```
2021-03-01
```

### ✅ Correct

```
20210301
```

---

## 8. ❌ Do NOT Mix Engines

| Incorrect           | Correct |
| ------------------- | ------- |
| COLLECTION + Report | DATA    |
| DATA + TDL          | INVALID |

---

## 9. 🔁 One XML = One Responsibility

Each request must fetch only ONE:

* Ledgers
* Vouchers
* Groups
* Reports

---

## 10. ⚙️ TDL is Mandatory for Collections

### Required:

```xml
<TDL>
  <TDLMESSAGE>
    <COLLECTION>
```

Without this → empty response

---

## 11. 🧠 Company Cannot Be Fetched

```xml
<TYPE>Company</TYPE>
```

❌ Not supported in XML API

---

## 12. 🔍 Debugging Checklist

When API returns empty:

1. Check TYPE
2. Check ID
3. Check OBJECT TYPE
4. Check TDL presence
5. Check date format

---

## 13. 🏗 Recommended Architecture

```
xml/
 ├── collection.builder.js
 ├── report.builder.js
```

---

## 14. 🧪 Validation Before Execution

### COLLECTION Request Must Have:

* ID = Collection
* TDL present
* TYPE defined inside COLLECTION

### DATA Request Must Have:

* Valid report name
* No COLLECTION block

---

# 🚀 Final Principle

Tally XML is NOT:

* SQL
* REST
* Table-based

It is:
👉 A **TDL-driven structured query system**

---

# 💯 Summary

| Problem            | Solution        |
| ------------------ | --------------- |
| Empty API response | Fix TYPE + ID   |
| Invalid collection | Use TDL         |
| Reports failing    | Use DATA        |
| Wrong data         | Fix date format |

---

# 🔥 Golden Rule

> If Tally returns empty → your XML is logically wrong, not syntactically wrong.

---
