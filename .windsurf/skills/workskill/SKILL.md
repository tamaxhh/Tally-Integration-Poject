---
name: workskill
description: A brief description, shown to the model to help it understand when to use this skill
---
# Cascade Skills for Advanced Development & Debugging

## Skill 1: Root Cause Analysis Expert

### Purpose
Systematically identify the true source of bugs, not just symptoms

### Trigger Phrases
- "debug", "fix bug", "error", "not working", "broken"

### Methodology
1. **Collect Evidence**
   - Full error message and stack trace
   - Exact file and line number
   - Steps to reproduce
   - Expected vs actual behavior

2. **Trace Backwards**
   - Start at error location
   - Follow data flow upstream
   - Check each transformation
   - Identify where expectation breaks

3. **Hypothesis Formation**
   - State what you think is wrong
   - Explain why this would cause the error
   - Identify what evidence supports this
   - List what would prove/disprove it

4. **Verification**
   - Test hypothesis with minimal change
   - Observe if behavior matches prediction
   - Adjust hypothesis if needed

### Example Application
```
User: "Getting 'undefined' error"

Instead of: Immediately suggesting null checks everywhere
Do: 
1. Ask: "Where exactly is the error occurring?"
2. Trace: "Where is this variable defined?"
3. Check: "What's the data flow to this point?"
4. Identify: "The root cause is X because..."
5. Fix: "Here's the minimal change needed..."
```

---

## Skill 2: Loop Prevention & Detection

### Purpose
Prevent getting stuck in debugging loops with multiple bugs

### Trigger
- Same error appearing multiple times
- New bugs appearing while fixing original bug
- More than 2 fix attempts on same issue

### Strategy
1. **Loop Detection**
   - Track number of attempts
   - Recognize when circling back to same error
   - Identify when new bugs are regression from fixes

2. **Circuit Breaker**
   ```
   IF attempts >= 3 AND problem_not_solved:
       STOP
       DOCUMENT what_tried
       REQUEST human_input
       CONSIDER if_understanding_is_wrong
   ```

3. **Focus Maintenance**
   - Keep original bug in primary focus
   - Document new bugs separately
   - Resist urge to fix everything at once
   - Ask user to prioritize if multiple critical bugs

### Example Response
```
"I've attempted 3 different approaches to fix this bug:
1. [Approach 1] - Result: [Outcome]
2. [Approach 2] - Result: [Outcome]  
3. [Approach 3] - Result: [Outcome]

I'm at my 3-attempt limit. Let me stop and reassess:
- What I understand: [summary]
- What I'm uncertain about: [gaps]
- Possible next steps: [options]

Which direction would you like me to investigate further?"
```

---

## Skill 3: Minimal Change Principle

### Purpose
Make smallest possible changes to fix bugs, reducing side effects

### Application Rules
1. **Before Changing**
   - Identify exact line(s) causing issue
   - Understand what code currently does
   - Plan the minimal modification needed

2. **Change Scope**
   - Modify 1 thing at a time
   - Keep changes localized
   - Avoid refactoring while bug-fixing
   - Don't "improve" unrelated code

3. **After Changing**
   - Test the specific change
   - Verify no new errors
   - Check related functionality

### Example
```
Bad Approach:
- "Let me rewrite this entire function to be cleaner"
- Changes 50 lines while fixing a typo

Good Approach:
- "The bug is on line 42: missing return statement"
- Changes 1 line: adds return
- Tests that specific code path
```

---

## Skill 4: Multi-Bug Triage

### Purpose
Handle situations with multiple bugs without getting overwhelmed

### Process
1. **List All Bugs**
   ```
   Critical: [bugs that break core functionality]
   High: [bugs that impact main features]
   Medium: [bugs that affect edge cases]
   Low: [bugs that are cosmetic/minor]
   ```

2. **Prioritization Decision**
   - If one bug is clearly most critical: Fix that first
   - If user started with specific bug: Solve that one
   - If multiple critical: Ask user which is most important

3. **Sequential Execution**
   ```
   FOR EACH bug IN priority_order:
       Focus completely on this bug
       Ignore other bugs temporarily
       Fix and verify thoroughly
       THEN move to next bug
   ```

4. **Resistance to Scope Creep**
   - "I notice bug X, but I'm focused on bug Y first"
   - "Let's complete the current fix before addressing the new issue"
   - Create TODO list instead of immediate action

---

## Skill 5: Dependency & Import Master

### Purpose
Quickly resolve module not found, import errors, dependency issues

### Diagnostic Checklist
```
[ ] Is file name/path spelled correctly? (case-sensitive!)
[ ] Does the file actually exist at that path?
[ ] Is the import statement syntax correct?
[ ] Is the package installed? (check package.json/requirements.txt)
[ ] Is the export statement correct in source file?
[ ] Are there circular dependencies?
[ ] Does the cache need clearing?
[ ] Are there path alias configurations? (tsconfig, webpack, etc.)
```

### Quick Fixes By Error Type

**"Cannot find module 'X'"**
```bash
# 1. Check if it's installed
npm list <package-name>

# 2. If not, install it
npm install <package-name>

# 3. If local file, check path
ls -la path/to/file

# 4. Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**"Module has no exported member 'X'"**
```typescript
// Check the actual exports in source file
// Verify import matches export type (default vs named)

// Wrong:
import MyComponent from './file'  // trying default import
// When file has: export const MyComponent = ...

// Right:
import { MyComponent } from './file'  // named import
```

---

## Skill 6: Test-Driven Debugging

### Purpose
Use testing to verify fixes and prevent regressions

### Workflow
1. **Before Fixing**
   - Write failing test that reproduces bug
   - Or identify existing test that's failing
   - Confirm test fails for right reason

2. **While Fixing**
   - Make changes
   - Run test repeatedly
   - Keep iterating until test passes

3. **After Fixing**
   - Confirm test now passes
   - Run full test suite
   - Check for regressions
   - Add edge case tests if needed

### Benefits
- Ensures bug is actually fixed
- Prevents bug from returning
- Documents what was broken
- Builds confidence in solution

---

## Skill 7: Stack Trace Detective

### Purpose
Extract maximum useful information from error messages and stack traces

### Reading Stack Traces
```
Error: Cannot read property 'map' of undefined
    at processData (app.js:45:18)          <- Where error occurred
    at handleRequest (app.js:32:12)        <- Who called it
    at Server.callback (server.js:120:5)   <- Call chain
```

### What to Look For
1. **Error Type**: "TypeError", "ReferenceError", etc.
2. **Error Message**: What specifically went wrong
3. **First Line**: Where error actually occurred (YOUR code)
4. **Call Chain**: How did we get here
5. **Line Number**: Exact location to investigate

### Investigation Steps
1. Go to file:line from first stack trace entry
2. Examine that exact line
3. Check what values variables have at that point
4. Trace where those values came from
5. Identify why they're not what's expected

---

## Skill 8: Environment & Configuration Debugging

### Purpose
Quickly identify and fix environment-related issues

### Common Issues & Solutions

**Environment Variables**
```bash
# Check if .env file exists
ls -la .env

# Verify variables are loaded
echo $VARIABLE_NAME

# Check .env is in .gitignore
cat .gitignore | grep .env
```

**Configuration Files**
```bash
# Common config files
package.json          # Node.js projects
tsconfig.json         # TypeScript
.eslintrc             # Linting
webpack.config.js     # Bundler
.env                  # Environment variables
```

**Path Resolution**
```javascript
// Check current directory
console.log(__dirname)
console.log(process.cwd())

// Verify file exists
const fs = require('fs')
console.log(fs.existsSync('./path/to/file'))
```

---

## Skill 9: Regression Prevention

### Purpose
Ensure fixes don't break existing functionality

### Pre-Change Checklist
```
[ ] What could this change affect?
[ ] Are there tests for those areas?
[ ] Should I run full test suite or subset?
[ ] Are there edge cases to consider?
```

### Post-Change Validation
```
[ ] Original bug is fixed
[ ] All tests still pass
[ ] Manual testing of affected features
[ ] Check for new console errors
[ ] Verify related functionality works
```

### Red Flags
- Changing core/shared utilities
- Modifying data structures
- Updating API interfaces
- Changing global configurations

---

## Skill 10: Code Review & Diff Analysis

### Purpose
Thoroughly review changes before applying them

### Review Checklist
```
[ ] Is the change minimal and focused?
[ ] Does it actually fix the bug?
[ ] Are there any typos?
[ ] Is formatting consistent?
[ ] Are variable names clear?
[ ] Is there any commented-out code to remove?
[ ] Are there console.logs to remove?
[ ] Does it follow project conventions?
```

### Using Git Diff
```bash
# See what's changed
git diff

# See specific file
git diff path/to/file

# Compare branches
git diff main feature-branch
```

---

## Skill 11: Performance Debugging

### Purpose
Identify and fix performance issues

### Common Performance Problems
1. **Unnecessary Re-renders** (React)
   - Missing dependencies in useEffect
   - Not memoizing expensive computations
   - Creating functions inside render

2. **Memory Leaks**
   - Not cleaning up event listeners
   - Not canceling subscriptions
   - Holding references to large objects

3. **Inefficient Algorithms**
   - Nested loops where not needed
   - Not caching repeated calculations
   - Loading too much data at once

### Debugging Tools
```javascript
// Timing
console.time('operation')
// ... code ...
console.timeEnd('operation')

// Memory
console.log(process.memoryUsage())

// Profiling
// Use browser DevTools Performance tab
// Or Node.js --prof flag
```

---

## Skill 12: Type System Mastery (TypeScript)

### Purpose
Leverage TypeScript to catch bugs before runtime

### Common Type Issues
```typescript
// Issue: Object is possibly 'undefined'
const value = obj?.property  // Use optional chaining

// Issue: Type 'X' is not assignable to type 'Y'
// Check: Are you using the right type?
// Check: Do you need type assertion? (use carefully)
const value = data as ExpectedType  // Only if you're sure!

// Issue: Argument of type 'X' is not assignable to parameter of type 'Y'
// Check function signature vs what you're passing
```

### Type-Safe Debugging
```typescript
// Add type annotations to catch issues early
function processData(data: UserData): ProcessedData {
  // TypeScript will catch type mismatches here
}

// Use type guards
if (typeof value === 'string') {
  // TypeScript knows value is string here
}

// Narrow types with discriminated unions
type Result = 
  | { success: true; data: Data }
  | { success: false; error: Error }
```

---

## Skill 13: Async/Promise Debugging

### Purpose
Debug asynchronous code and promise chains

### Common Async Issues
```javascript
// Issue: Unhandled promise rejection
asyncFunction()
  .then(result => { })
  .catch(error => console.error(error))  // Always catch!

// Issue: Race conditions
// Use Promise.all for parallel operations
await Promise.all([op1(), op2(), op3()])

// Issue: Forgetting await
const result = await asyncFunction()  // Don't forget await!

// Issue: Async in forEach (doesn't work as expected)
// Instead use:
for (const item of items) {
  await processItem(item)
}
// Or:
await Promise.all(items.map(item => processItem(item)))
```

---

## Skill 14: Database & API Debugging

### Purpose
Debug issues with external data sources

### API Debugging
```javascript
// Log full request and response
console.log('Request:', {
  url,
  method,
  headers,
  body
})

try {
  const response = await fetch(url, options)
  console.log('Response status:', response.status)
  const data = await response.json()
  console.log('Response data:', data)
} catch (error) {
  console.error('API Error:', error)
}
```

### Database Debugging
```javascript
// Log queries
console.log('SQL Query:', query)
console.log('Parameters:', params)

// Check connection
try {
  await db.query('SELECT 1')
  console.log('Database connected')
} catch (error) {
  console.error('Database connection failed:', error)
}

// Verify data exists
const count = await db.query('SELECT COUNT(*) FROM table')
console.log('Row count:', count)
```

---

## Skill 15: Documentation & Knowledge Capture

### Purpose
Document bugs and solutions for future reference

### Bug Report Template
```markdown
## Bug Description
[Clear description of the problem]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Error occurs]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Environment
- OS: [e.g., macOS 12.0]
- Node version: [e.g., 18.0.0]
- Browser: [e.g., Chrome 110]

## Root Cause
[What was actually wrong]

## Solution Applied
[What was changed and why]

## Files Modified
- [file1.js] - [what changed]
- [file2.ts] - [what changed]

## Testing
- [How to verify fix works]
- [What tests were run]
```

---

## Integration: Using All Skills Together

### Example Complex Bug Scenario
```
User: "My app crashes when I click submit"

Application of Skills:

1. Stack Trace Detective
   → Identify exact error location

2. Root Cause Analysis
   → Trace why crash occurs

3. Loop Prevention
   → Track attempts, limit to 3

4. Minimal Change
   → Fix only what's broken

5. Test-Driven
   → Verify fix works

6. Regression Prevention
   → Check nothing else broke

7. Documentation
   → Record what was learned
```

### Emergency Protocol
```
IF getting stuck in loop:
  1. STOP all debugging
  2. Use Loop Prevention skill
  3. Document current state
  4. Request human input

IF multiple bugs appear:
  1. Use Multi-Bug Triage skill
  2. Fix original bug only
  3. Document other bugs
  4. Ask for prioritization

IF unsure about approach:
  1. Use Root Cause Analysis skill
  2. Form clear hypothesis
  3. Test hypothesis
  4. Adjust if wrong
```

---

## Continuous Improvement

After each debugging session:
1. What worked well?
2. What caused delays?
3. What would prevent this bug in future?
4. What did I learn?

Update skills based on patterns observed.
