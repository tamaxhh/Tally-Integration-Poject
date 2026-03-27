# Agent Debugging Rules — Anti-Loop Protocol

## Core Principle
**One fix. One verify. Then stop.**
Never apply a second fix until the first one is confirmed working or confirmed failed.
Never create new files to work around a broken file. Fix the broken file.

---

## Rule 1 — Diagnose Before You Touch Anything

Before editing any file, answer all three questions out loud:

1. **What is the exact error message?** (copy it verbatim, do not paraphrase)
2. **Which file and line is the direct source of this error?** (not a side effect — the source)
3. **What is the single smallest change that targets only that line?**

If you cannot answer all three, run more diagnostics. Do not edit yet.

---

## Rule 2 — One Fix Per Cycle

A cycle is: **diagnose → edit one thing → verify → report**.

- Edit **one file** per cycle, targeting **one root cause**
- After the edit, **verify immediately** before touching anything else
- If verification shows a new error, **stop and report** — do not autonomously patch the new error
- A new error after a fix means the fix itself may have caused it — treat it as a new diagnosis, not a continuation

---

## Rule 3 — Never Create New Files to Dodge a Broken One

If a file has a bug, **fix that file**.

Do not:
- Create `tally-groups-v2.service.js` because `tally-groups.service.js` has an error
- Create a new route file because the existing route has a conflict
- Add a new service to bypass an old one that isn't working

Every workaround file adds a new surface for bugs and makes the next error harder to trace.
**Exception:** a new file is only justified if the original file is genuinely irrelevant to the feature being built.

---

## Rule 4 — Infrastructure Changes Are Last Resort

Changes to `docker-compose.yml`, `Dockerfile`, volume mounts, or server config are **last resort only**.

Before touching infrastructure:
- Confirm the bug is definitely not in application code
- Confirm the file you're trying to reach actually exists on the host at the path you think it does
- Run `docker-compose exec app ls -la /app/` to verify what the container actually sees — do this **before** editing docker-compose.yml, not after

Infrastructure changes require a full `docker-compose down && docker-compose build --no-cache && docker-compose up -d` to take effect. A simple restart will not apply volume mount changes.

---

## Rule 5 — Verify Means Verify, Not Assume

After every edit, run the actual test command and read the actual output.

Do not:
- Assume the edit worked because the file saved successfully
- Restart the service and call it done without hitting the endpoint
- Skip verification because "the logic looks right"

Verification for this project means:
```
docker-compose restart app
curl -H "X-API-Key: dev-key-local-only" http://localhost:3000/api/v1/<endpoint>
docker-compose logs app --tail=20
```
Read all three outputs before deciding what to do next.

---

## Rule 6 — Track What You've Already Tried

Before trying an approach, check: **has this exact thing already been attempted?**

If you are about to:
- Edit the same file you edited two cycles ago
- Try the same XML format string that didn't work before
- Rebuild Docker for the third time without a confirmed new change

**Stop.** The problem is not what you think it is. Step back and re-read the actual error from scratch.

Maintain a mental list in every session:
- Attempts made so far
- What each attempt changed
- What the result was

If the same error has appeared three times in a row, the fix has been wrong all three times. Do not try it a fourth time.

---

## Rule 7 — Case Sensitivity and Exact String Matching

For Tally XML specifically, these values are case-sensitive and must be exact:

| Wrong | Correct |
|-------|---------|
| `Export Data` | `EXPORT` |
| `<TYPE>Collection</TYPE>` | `<TYPE>COLLECTION</TYPE>` |
| `<SVEXPORTFORMAT>XML</SVEXPORTFORMAT>` | `<SVEXPORTFORMAT>$$SysName:XML</SVEXPORTFORMAT>` |
| `<FETCH>*</FETCH>` | Explicit field list |

When an endpoint returns empty data but no error, the first thing to check is whether the XML sent to Tally matches the exact casing and format of a known-working request. Do not invent new XML formats — copy the structure of what already works.

---

## Rule 8 — Escalate Instead of Spiral

If the same bug survives **three full fix cycles**, stop autonomous attempts and report to the user with:

1. The exact current error message
2. The three things tried and why each didn't work
3. A specific question: "I need to know X before I can proceed"

A two-sentence honest status report is better than a tenth attempted fix.
The user can often spot the real issue in seconds when given accurate information.

---

## Anti-Spiral Checklist (Run This When Stuck)

Before starting a new fix attempt, answer these:

- [ ] Am I fixing the root cause or a symptom of my last fix?
- [ ] Have I already tried this exact approach before?
- [ ] Does the file I'm editing actually exist where I think it does?
- [ ] Is the container running the code I think it is? (`docker-compose exec app cat /app/<file>`)
- [ ] Am I creating a new file when I should be fixing an existing one?
- [ ] Have I verified the last fix actually failed, or did I just assume it did?

If any box is unchecked, resolve it before writing a single line of code.