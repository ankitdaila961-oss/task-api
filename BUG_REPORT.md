# Bug Report – Task API

## 1. Overview

During the review and testing of the existing Task API, multiple functional issues were identified in the implementation.

The purpose of this bug investigation was to:

1. Understand the existing API behavior.
2. Identify incorrect or unexpected behavior.
3. Reproduce each issue through automated tests.
4. Confirm the root cause.
5. Implement the smallest appropriate fix.
6. Add regression tests where required.
7. Run the complete test suite after making changes.
8. Verify that existing functionality was not broken.

In addition to fixing the identified issues, a task assignment feature was implemented with proper validation and API-level tests.

---

# 2. Summary of Identified Issues

| # | Issue | Severity | Status |
|---|---|---|---|
| 1 | Incorrect pagination offset | Medium | Fixed |
| 2 | Partial status matching | Medium | Fixed |
| 3 | Task priority changed when completing a task | Medium | Fixed |

Additional feature implemented:

| Feature | Status |
|---|---|
| Task assignment endpoint | Implemented |
| Assignee validation | Implemented |
| Assignment API tests | Implemented |

---

# 3. Bug 1 – Incorrect Pagination Offset

## Severity

**Medium**

## Location

```text
src/services/taskService.js
