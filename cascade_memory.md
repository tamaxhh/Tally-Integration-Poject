# Cascade Memory Configuration - Anti-Loop Learning System

## Memory Structure Overview

Cascade should maintain persistent memory across sessions to avoid repeating mistakes and improve debugging efficiency.

---

## 1. Project-Specific Memory

### Project Architecture Understanding
```json
{
  "project_name": "[Auto-detected from package.json/repo]",
  "tech_stack": {
    "frontend": ["React", "TypeScript", "Tailwind"],
    "backend": ["Node.js", "Express", "PostgreSQL"],
    "build_tools": ["Vite", "npm"],
    "testing": ["Jest", "React Testing Library"]
  },
  "key_patterns": {
    "component_structure": "Functional components with hooks",
    "state_management": "Context API + custom hooks",
    "styling_approach": "Tailwind utility classes",
    "api_convention": "RESTful with /api prefix"
  },
  "important_paths": {
    "components": "/src/components",
    "utils": "/src/utils",
    "api": "/src/api",
    "types": "/src/types",
    "tests": "/src/__tests__"
  }
}
```

### Configuration Files Tracked
```json
{
  "config_locations": {
    "typescript": "tsconfig.json",
    "eslint": ".eslintrc.js",
    "env_vars": ".env.local",
    "package_manager": "npm (not yarn or pnpm)",
    "build": "vite.config.ts"
  },
  "custom_aliases": {
    "@": "./src",
    "@components": "./src/components",
    "@utils": "./src/utils"
  }
}
```

---

## 2. Bug History & Patterns Memory

### Recently Fixed Bugs
```json
{
  "bug_history": [
    {
      "id": "bug_001",
      "date": "2024-03-26",
      "description": "Module not found error for @/components/Button",
      "root_cause": "Vite alias configuration missing in tsconfig paths",
      "solution": "Added path mapping in tsconfig.json",
      "fix_attempts": 2,
      "files_modified": ["tsconfig.json"],
      "learned": "Always check tsconfig paths match Vite aliases",
      "tags": ["import-error", "typescript", "vite"]
    },
    {
      "id": "bug_002", 
      "date": "2024-03-26",
      "description": "Infinite re-render in UserProfile component",
      "root_cause": "useEffect missing dependency array",
      "solution": "Added empty dependency array to useEffect",
      "fix_attempts": 1,
      "files_modified": ["src/components/UserProfile.tsx"],
      "learned": "Always add dependency array to useEffect",
      "tags": ["react", "infinite-loop", "hooks"]
    }
  ]
}
```

### Common Bug Patterns in This Project
```json
{
  "recurring_patterns": [
    {
      "pattern": "Import path case sensitivity",
      "frequency": 5,
      "typical_cause": "Developer uses wrong case in import statement",
      "quick_fix": "Check exact filename case in file system",
      "prevention": "Use auto-import from IDE"
    },
    {
      "pattern": "Async state update after unmount",
      "frequency": 3,
      "typical_cause": "API call completes after component unmounts",
      "quick_fix": "Add cleanup function with abort controller",
      "prevention": "Always cleanup async operations in useEffect"
    },
    {
      "pattern": "Missing environment variables",
      "frequency": 4,
      "typical_cause": "New env var added but not in .env.local",
      "quick_fix": "Check .env.example and update .env.local",
      "prevention": "Document all env vars in .env.example"
    }
  ]
}
```

### Failed Approaches (Don't Try Again)
```json
{
  "failed_solutions": [
    {
      "problem": "CORS errors in development",
      "attempted_fix": "Added CORS headers to frontend fetch calls",
      "why_failed": "CORS must be configured on backend, not frontend",
      "learned": "CORS is server-side configuration only",
      "dont_try_again": "Adding headers to fetch in frontend for CORS"
    },
    {
      "problem": "State not updating immediately after setState",
      "attempted_fix": "Called setState multiple times",
      "why_failed": "setState is asynchronous, batches updates",
      "learned": "Use functional setState or useEffect to access updated state",
      "dont_try_again": "Expecting immediate state updates"
    }
  ]
}
```

---

## 3. Developer Preferences & Coding Style Memory

### Code Style Preferences
```json
{
  "user_preferences": {
    "language": "TypeScript (strictly typed, no any)",
    "naming_conventions": {
      "components": "PascalCase",
      "functions": "camelCase", 
      "constants": "SCREAMING_SNAKE_CASE",
      "files": "kebab-case for utils, PascalCase for components"
    },
    "formatting": {
      "quotes": "single",
      "semicolons": true,
      "trailing_commas": "es5",
      "indent": 2
    },
    "react_patterns": {
      "prefer": "functional components with hooks",
      "avoid": "class components",
      "state": "useState for local, Context for global",
      "props": "destructure in function signature"
    },
    "error_handling": {
      "prefer": "try-catch with specific error types",
      "logging": "use custom logger utility, not console.log",
      "user_errors": "show toast notifications"
    }
  }
}
```

### Communication Preferences
```json
{
  "communication_style": {
    "verbosity": "concise but explain reasoning",
    "code_explanations": "comment only non-obvious logic",
    "ask_before": ["major refactors", "dependency changes", "breaking changes"],
    "dont_ask_before": ["formatting fixes", "obvious typos", "adding types"],
    "preferred_response": "show code first, explain after",
    "avoid": ["over-apologizing", "excessive politeness", "stating obvious"]
  }
}
```

---

## 4. Debugging Loop Memory (Critical for Prevention)

### Current Session State
```json
{
  "current_debugging_session": {
    "active_bug": "User authentication not persisting after refresh",
    "attempts_count": 2,
    "approaches_tried": [
      {
        "attempt": 1,
        "approach": "Added localStorage to store token",
        "result": "Token saved but not being read on refresh",
        "learned": "localStorage works for write, issue is in read logic"
      },
      {
        "attempt": 2,
        "approach": "Added useEffect to read token on mount",
        "result": "Token read but auth state not updating",
        "learned": "Auth context not re-initializing with token"
      }
    ],
    "next_planned_attempt": "Initialize auth context with token from localStorage in provider",
    "max_attempts_allowed": 3,
    "circuit_breaker_status": "OK (2/3 attempts used)"
  }
}
```

### Loop Detection Triggers
```json
{
  "loop_indicators": {
    "same_error_count": 0,
    "max_same_error_allowed": 2,
    "new_bugs_introduced": 0,
    "max_new_bugs_allowed": 1,
    "reversion_count": 0,
    "max_reversions_allowed": 2,
    "time_spent_minutes": 15,
    "alert_if_exceeds_minutes": 30
  },
  "circuit_breaker_rules": {
    "if_same_error_3_times": "STOP and request human input",
    "if_2_new_bugs_introduced": "REVERT all changes and reassess",
    "if_3_reversions": "STOP - approach is fundamentally wrong",
    "if_30_minutes_no_progress": "PAUSE and summarize what's known vs unknown"
  }
}
```

---

## 5. Dependency & Package Memory

### Known Working Versions
```json
{
  "working_dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "vite": "^4.3.0",
    "tailwindcss": "^3.3.0"
  },
  "problematic_versions": [
    {
      "package": "react-router-dom",
      "version": "6.8.0",
      "issue": "Breaking change in Navigate component",
      "working_version": "6.7.0",
      "note": "Pinned to 6.7.0 until we update Navigate usage"
    }
  ],
  "peer_dependency_conflicts": [
    {
      "package": "eslint-plugin-react",
      "requires": "eslint ^8.0.0",
      "note": "Don't upgrade eslint to v9 yet"
    }
  ]
}
```

### Common Import Errors & Solutions
```json
{
  "import_error_solutions": {
    "module_not_found_@components": {
      "cause": "Path alias not configured",
      "check_files": ["tsconfig.json", "vite.config.ts"],
      "solution": "Ensure both have matching alias configuration"
    },
    "cannot_find_module_axios": {
      "cause": "Package not installed",
      "solution": "npm install axios",
      "note": "Don't forget to restart dev server"
    },
    "default_export_not_found": {
      "cause": "Trying default import on named export",
      "solution": "Use named import: import { Component } from 'file'"
    }
  }
}
```

---

## 6. Testing Memory

### Test Patterns That Work
```json
{
  "successful_test_patterns": {
    "component_rendering": "Use render from @testing-library/react",
    "async_behavior": "Use waitFor for async state updates",
    "user_interactions": "Use userEvent.click not fireEvent.click",
    "mocking_api": "Use MSW (Mock Service Worker) not jest.mock(axios)"
  },
  "test_data_location": "/src/__tests__/fixtures",
  "test_utilities": "/src/__tests__/utils/test-utils.tsx"
}
```

### Common Test Failures
```json
{
  "test_failure_patterns": [
    {
      "error": "Cannot find module when running tests",
      "cause": "Jest doesn't understand path aliases",
      "solution": "Add moduleNameMapper to jest.config.js"
    },
    {
      "error": "act() warning in tests",
      "cause": "State update not wrapped in act()",
      "solution": "Use waitFor or await findBy* queries"
    }
  ]
}
```

---

## 7. Performance & Optimization Memory

### Known Performance Bottlenecks
```json
{
  "performance_issues": [
    {
      "component": "UserList",
      "issue": "Renders all 1000 users at once",
      "solution": "Implemented virtual scrolling with react-window",
      "learned": "Lists > 100 items need virtualization"
    },
    {
      "component": "Dashboard",
      "issue": "Re-renders on every data fetch",
      "solution": "Memoized with React.memo and useMemo for calculations",
      "learned": "Expensive calculations should be memoized"
    }
  ]
}
```

---

## 8. Git & Version Control Memory

### Branch Strategy
```json
{
  "branching": {
    "main_branch": "main",
    "development_branch": "develop", 
    "feature_prefix": "feature/",
    "bugfix_prefix": "bugfix/",
    "current_branch": "feature/auth-persistence"
  },
  "commit_conventions": {
    "format": "type(scope): message",
    "types": ["feat", "fix", "docs", "style", "refactor", "test", "chore"],
    "example": "fix(auth): persist user session after refresh"
  }
}
```

---

## 9. Environment-Specific Memory

### Development Environment
```json
{
  "dev_environment": {
    "node_version": "18.16.0",
    "npm_version": "9.5.1",
    "os": "macOS",
    "editor": "VS Code",
    "extensions": ["ESLint", "Prettier", "TypeScript", "Tailwind CSS IntelliSense"],
    "dev_server_port": 5173,
    "api_proxy": "http://localhost:3000"
  }
}
```

### Common Environment Issues
```json
{
  "env_troubleshooting": {
    "port_already_in_use": "Kill process: lsof -ti:5173 | xargs kill",
    "node_modules_corrupted": "rm -rf node_modules package-lock.json && npm install",
    "cache_issues": "Clear Vite cache: rm -rf node_modules/.vite"
  }
}
```

---

## 10. Learning & Improvement Memory

### Mistakes Made & Lessons Learned
```json
{
  "lessons_learned": [
    {
      "date": "2024-03-25",
      "mistake": "Modified 5 files while debugging single bug",
      "consequence": "Created 3 new bugs, spent 2 hours reverting",
      "lesson": "ALWAYS change one thing at a time",
      "prevention": "Check diff before applying, use git checkpoints"
    },
    {
      "date": "2024-03-24",
      "mistake": "Assumed API response format without checking",
      "consequence": "Spent 30 minutes debugging wrong issue",
      "lesson": "ALWAYS log and inspect API responses first",
      "prevention": "Add console.log for API responses during debugging"
    },
    {
      "date": "2024-03-23",
      "mistake": "Fixed symptom instead of root cause",
      "consequence": "Bug returned in different form",
      "lesson": "Always trace to root cause before fixing",
      "prevention": "Ask 'why' 5 times before implementing fix"
    }
  ]
}
```

### Success Patterns to Repeat
```json
{
  "successful_approaches": [
    {
      "situation": "Complex state management bug",
      "approach": "Added detailed logging at each state transition",
      "result": "Found issue in 5 minutes instead of guessing",
      "repeat_when": "Debugging state-related issues"
    },
    {
      "situation": "Type errors after refactoring",
      "approach": "Let TypeScript catch errors, fixed them one by one",
      "result": "No runtime errors, all caught at compile time",
      "repeat_when": "Any major refactoring"
    }
  ]
}
```

---

## Memory Update Triggers

### When to Update Memory

**After Every Debugging Session:**
```
- Add bug to bug_history
- Update recurring_patterns if applicable
- Add to failed_solutions if approach didn't work
- Add to lessons_learned if mistake was made
- Reset current_debugging_session
```

**After Adding/Changing Dependencies:**
```
- Update working_dependencies
- Note any issues in problematic_versions
- Update import_error_solutions if new patterns emerge
```

**After Major Refactoring:**
```
- Update project_architecture if structure changed
- Update key_patterns if conventions changed
- Update important_paths if moved files
```

**After Performance Optimization:**
```
- Add to performance_issues (problem + solution)
- Note approach for future reference
```

**On Loop Detection:**
```
- Increment loop_indicators
- Check circuit_breaker_rules
- Update current_debugging_session with attempt details
```

---

## Memory Retrieval Rules

### Before Starting Any Task
```
CHECK memory for:
1. Similar bugs fixed before → Use same solution
2. Failed approaches → Avoid trying again
3. Project patterns → Follow established conventions
4. Common errors → Apply known fixes first
```

### During Debugging
```
CHECK memory for:
1. Current attempt count → Trigger circuit breaker if needed
2. Similar error patterns → Apply pattern-specific fix
3. Recent changes → Could this be related?
```

### Before Suggesting Solution
```
CHECK memory for:
1. User preferences → Match coding style
2. Past mistakes → Don't repeat them
3. Successful approaches → Use proven patterns
```

---

## Memory Persistence Format

### Save Memory To File
```json
{
  "last_updated": "2024-03-26T10:30:00Z",
  "project_root": "/Users/dev/project",
  "memory_version": "1.0",
  "project_memory": { },
  "bug_history": [ ],
  "developer_preferences": { },
  "loop_prevention": { },
  "dependencies": { },
  "testing": { },
  "performance": { },
  "git": { },
  "environment": { },
  "learning": { }
}
```

### Location
```
.windsurf/memory.json
or
.cascade/memory.json
```

---

## Anti-Loop Memory Rules (CRITICAL)

### Rule 1: Remember Attempt Count
```
ALWAYS check current_debugging_session.attempts_count
IF attempts_count >= 3:
    STOP and request human input
    DO NOT try 4th approach without approval
```

### Rule 2: Remember Failed Solutions
```
BEFORE suggesting solution:
    CHECK failed_solutions
    IF solution matches failed_approach:
        SKIP this approach
        Try different angle
```

### Rule 3: Remember Success Patterns
```
IF similar bug in bug_history:
    RETRIEVE solution that worked
    APPLY same approach first
    ONLY if that fails, try new approach
```

### Rule 4: Remember Mistakes
```
BEFORE making change:
    CHECK lessons_learned
    ENSURE not repeating past mistake
    IF similar situation, apply prevention strategy
```

### Rule 5: Update Memory After Every Session
```
AFTER completing/abandoning task:
    SAVE what was learned
    UPDATE relevant memory sections
    RESET session counters
```

---

## Example Memory Usage

### Scenario: Import Error
```
User: "Getting 'cannot find module @/components/Button'"

Cascade Memory Check:
1. Check import_error_solutions
2. Found: "module_not_found_@components"
3. Known cause: "Path alias not configured"
4. Known solution: "Check tsconfig.json and vite.config.ts"

Response:
"I see this is a path alias issue. Based on previous fixes, 
this is usually caused by missing configuration. Let me check 
your tsconfig.json and vite.config.ts files..."

[Applies known working solution immediately]
```

### Scenario: Hitting Loop
```
Current State:
- attempts_count: 3
- same_error_count: 3
- circuit_breaker_status: TRIGGERED

Response:
"I've hit my 3-attempt limit on this bug. Here's what I've tried:
1. [Approach 1] - Result: [X]
2. [Approach 2] - Result: [Y]  
3. [Approach 3] - Result: [Z]

I'm clearly missing something fundamental. Let me stop and 
ask: [specific question about gap in understanding]"
```

---

## Memory Optimization

### Keep Memory Relevant
- Archive bugs older than 3 months
- Keep only top 20 most frequent patterns
- Remove obsolete dependency issues
- Update versions when packages upgraded

### Memory Size Management
- Max 100 bugs in history
- Max 50 failed solutions
- Max 30 recurring patterns
- Compress/archive old data

This memory system ensures Cascade learns from experience and doesn't repeat mistakes!
