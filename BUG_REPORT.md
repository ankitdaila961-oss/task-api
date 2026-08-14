# Bug Report – Task API

## 1. Project Overview

This document describes the bugs identified, reproduced, fixed, and tested during the development of the Task API take-home assignment.

The existing Task API was reviewed from both a functional and testing perspective. The main objective was to identify incorrect behavior, reproduce the issues with automated tests, implement focused fixes, and ensure that the changes did not break existing functionality.

In addition to fixing the identified bugs, a task assignment feature was implemented with validation, error handling, and automated API tests.

---

# 2. Bug Investigation Approach

Each identified issue was handled using the following process:

1. Review the existing implementation.
2. Identify potentially incorrect behavior.
3. Create a test that reproduces the issue.
4. Run the test and confirm the failure.
5. Identify the root cause.
6. Implement the smallest appropriate fix.
7. Add or update regression tests.
8. Run the complete test suite.
9. Run test coverage.
10. Verify that all existing and newly added functionality works correctly.

This approach helps ensure that fixes are reliable and that previously working functionality is not accidentally affected.

---

# 3. Summary of Bugs

| Bug | Description | Severity | Status |
|---|---|---|---|
| Bug 1 | Incorrect pagination offset | Medium | Fixed |
| Bug 2 | Partial status matching | Medium | Fixed |
| Bug 3 | Priority changed when completing a task | Medium | Fixed |

### Additional Feature

| Feature | Status |
|---|---|
| Task assignment endpoint | Implemented |
| Assignee validation | Implemented |
| Assignment error handling | Implemented |
| Assignment API tests | Implemented |

---

# 4. Bug 1 – Incorrect Pagination Offset

## Severity

**Medium**

## Location

```text
src/services/taskService.js
```

## Affected Function

```text
getPaginated()
```

## Problem

The original pagination implementation calculated the offset using:

```javascript
const offset = page * limit;
```

This is incorrect when the API uses a 1-based page number.

For example, if the client requests:

```text
page = 1
limit = 2
```

the original implementation calculates:

```text
offset = 1 * 2
offset = 2
```

This causes the first two tasks to be skipped.

Instead of returning:

```text
Task 1
Task 2
```

page 1 starts from the third task.

---

## Expected Behavior

For a 1-based page number, page 1 should start from index 0.

For:

```text
page = 1
limit = 2
```

the correct calculation is:

```text
offset = (page - 1) * limit
offset = (1 - 1) * 2
offset = 0
```

Therefore, page 1 should return the first two tasks.

---

## Reproduction

The issue can be reproduced by creating multiple tasks and requesting the first page.

Example:

```javascript
const tasks = taskService.getPaginated(1, 2);
```

Expected:

```text
Task 1
Task 2
```

Original behavior:

```text
Task 3
```

or tasks starting from the third item, depending on the number of tasks available.

---

## Root Cause

The page number was treated as if it were zero-based.

The original code was:

```javascript
const offset = page * limit;
```

For a user-facing API, page numbers are expected to start from 1.

---

## Fix

The offset calculation was changed to:

```javascript
const offset = (page - 1) * limit;
```

This correctly converts the 1-based page number into a zero-based array offset.

---

## Regression Test

A test was added to verify page 1 behavior:

```javascript
const tasks = taskService.getPaginated(1, 2);

expect(tasks).toHaveLength(2);
expect(tasks[0].title).toBe('Task 1');
expect(tasks[1].title).toBe('Task 2');
```

The test initially failed with the original implementation.

After the fix, the test passes successfully.

---

## Final Result

Pagination now correctly handles 1-based page numbers.

Example:

```text
GET /tasks?page=1&limit=2
```

returns the first two tasks instead of skipping them.

---

# 5. Bug 2 – Partial Status Matching

## Severity

**Medium**

## Location

```text
src/services/taskService.js
```

## Affected Function

```text
getByStatus()
```

## Problem

The original implementation used:

```javascript
const getByStatus = (status) => tasks.filter((t) => t.status.includes(status));
```

The use of `includes()` caused partial status matching.

For example:

```javascript
'in_progress'.includes('progress')
```

returns:

```text
true
```

Therefore, searching for:

```text
progress
```

incorrectly matched:

```text
in_progress
```

---

## Expected Behavior

Task statuses should be matched exactly.

The supported statuses are:

```text
todo
in_progress
done
```

Expected behavior:

```text
todo        → todo        = match
in_progress → in_progress = match
done        → done        = match
progress    → in_progress = no match
```

---

## Reproduction

A task was created with:

```javascript
taskService.create({
  title: 'Progress task',
  status: 'in_progress',
});
```

Then:

```javascript
const tasks = taskService.getByStatus('progress');
```

was executed.

Expected result:

```text
[]
```

because `progress` is not an exact task status.

The original implementation returned the `in_progress` task.

---

## Root Cause

The problem was caused by:

```javascript
t.status.includes(status)
```

`includes()` checks whether one string exists inside another string and therefore allows partial matches.

---

## Regression Test

The following edge-case test was added:

```javascript
test('should not match a partial status', () => {
  taskService.create({
    title: 'Progress task',
    status: 'in_progress',
  });

  const tasks = taskService.getByStatus('progress');

  expect(tasks).toHaveLength(0);
});
```

The test initially failed.

The result was:

```text
Expected length: 0
Received length: 1
```

This confirmed that the bug was real.

---

## Fix

The status filter was changed to exact comparison:

```javascript
const getByStatus = (status) =>
  tasks.filter((t) => t.status === status);
```

---

## Final Result

The API now performs exact status matching.

For example:

```text
GET /tasks?status=in_progress
```

matches tasks whose status is exactly:

```text
in_progress
```

while:

```text
GET /tasks?status=progress
```

does not incorrectly match `in_progress`.

---

# 6. Bug 3 – Priority Changed When Completing a Task

## Severity

**Medium**

## Location

```text
src/services/taskService.js
```

## Affected Function

```text
completeTask()
```

## Problem

The original task completion logic changed the task priority to:

```text
medium
```

whenever a task was completed.

This caused unrelated task information to be modified.

For example:

```text
Before completion:

status   = in_progress
priority = high
```

After completion, the original implementation produced:

```text
status   = done
priority = medium
```

The priority was unintentionally changed.

---

## Expected Behavior

Completing a task should update the completion-related fields while preserving the existing priority.

Expected behavior:

```text
status      → done
completedAt → current timestamp
priority    → unchanged
```

For example:

```text
Before:

priority = high
```

After:

```text
priority = high
```

---

## Root Cause

The original completion implementation explicitly assigned:

```javascript
priority: 'medium'
```

This forced every completed task to become medium priority.

---

## Reproduction

A high-priority task was created:

```javascript
const created = taskService.create({
  title: 'Complete me',
  priority: 'high',
});
```

Then:

```javascript
const completed = taskService.completeTask(created.id);
```

was executed.

Expected:

```text
status = done
priority = high
```

Original behavior:

```text
status = done
priority = medium
```

---

## Regression Test

A regression test was added:

```javascript
const created = taskService.create({
  title: 'Complete me',
  priority: 'high',
});

const completed = taskService.completeTask(created.id);

expect(completed.status).toBe('done');
expect(completed.completedAt).not.toBeNull();
expect(completed.priority).toBe('high');
```

The test initially failed with:

```text
Expected: "high"
Received: "medium"
```

This confirmed the issue.

---

## Fix

The hard-coded priority modification was removed.

The completion logic now preserves the existing task priority and only changes the fields required for completion.

The resulting behavior is:

```text
status      = done
completedAt = current timestamp
priority    = existing priority
```

---

## Final Result

A high-priority task remains high priority after completion.

Example:

```text
Before completion:
priority = high

After completion:
status = done
priority = high
completedAt = timestamp
```

This prevents unrelated task information from being modified.

---

# 7. Feature Added – Task Assignment

As part of the take-home assignment, a task assignment feature was implemented.

## Endpoint

```http
PATCH /tasks/:id/assign
```

The endpoint allows a task to be assigned to a user.

---

## Request Example

```json
{
  "assignee": "Ritik"
}
```

Example request:

```text
PATCH /tasks/:id/assign
```

with:

```json
{
  "assignee": "Ritik"
}
```

The API updates the task with the assigned user.

---

# 8. Assignee Validation

The assignment endpoint validates the `assignee` field before updating a task.

The following rules are enforced:

- `assignee` must be provided.
- `assignee` must be a string.
- `assignee` must not be empty.
- `assignee` must not contain only whitespace.

---

## Case 1 – Missing Assignee

Request:

```json
{}
```

Expected response:

```text
400 Bad Request
```

---

## Case 2 – Empty Assignee

Request:

```json
{
  "assignee": ""
}
```

Expected response:

```text
400 Bad Request
```

---

## Case 3 – Whitespace-only Assignee

Request:

```json
{
  "assignee": "   "
}
```

Expected response:

```text
400 Bad Request
```

---

## Case 4 – Invalid Task ID

If the requested task does not exist:

```text
404 Not Found
```

is returned.

This prevents an assignment from being applied to a non-existent task.

---

# 9. Assignee Whitespace Handling

The assignment implementation trims unnecessary whitespace.

For example:

```json
{
  "assignee": "  Ritik  "
}
```

is normalized to:

```json
{
  "assignee": "Ritik"
}
```

This ensures that unnecessary spaces are not stored as part of the assignee name.

---

# 10. Task Reassignment

The assignment feature also supports reassignment.

For example:

```text
Initial assignee:
Ritik
```

can later be changed to:

```text
New assignee:
Aman
```

The latest valid assignment replaces the previous assignee.

This allows tasks to be transferred between users when required.

---

# 11. API Validation

The Task API also validates task creation and update requests.

## Title Validation

The title must:

- Be provided when creating a task.
- Be a string.
- Not be empty.
- Not contain only whitespace.

Invalid example:

```json
{
  "title": ""
}
```

returns:

```text
400 Bad Request
```

---

## Status Validation

Valid statuses are:

```text
todo
in_progress
done
```

Invalid status values are rejected.

Example:

```json
{
  "title": "Test task",
  "status": "invalid"
}
```

returns:

```text
400 Bad Request
```

---

## Priority Validation

Valid priorities are:

```text
low
medium
high
```

Invalid priority values are rejected.

---

## Due Date Validation

If a due date is provided, it must be a valid date string.

Invalid dates are rejected with:

```text
400 Bad Request
```

---

# 12. Error Handling

The API returns appropriate HTTP status codes for different situations.

| Situation | Status |
|---|---|
| Successful GET | 200 |
| Successful POST | 201 |
| Successful PUT | 200 |
| Successful PATCH | 200 |
| Successful DELETE | 204 |
| Invalid request | 400 |
| Task not found | 404 |
| Unexpected server error | 500 |

The Express application also contains centralized error handling for unexpected server errors.

---

# 13. Testing Strategy

Testing was performed at both service and API levels.

The project uses:

- Jest
- Supertest

Jest is used for automated testing, while Supertest is used for testing the Express API endpoints.

---

# 14. Unit Tests

The service layer tests cover the following functionality:

- Creating a task.
- Creating a task with default values.
- Creating a task with custom values.
- Getting all tasks.
- Finding a task by ID.
- Handling an unknown task ID.
- Filtering tasks by status.
- Preventing partial status matches.
- Paginating tasks.
- Updating a task.
- Handling updates for unknown tasks.
- Removing a task.
- Handling deletion of unknown tasks.
- Completing a task.
- Handling completion of unknown tasks.
- Preserving priority when completing a task.
- Calculating task statistics.
- Task assignment behavior.

---

# 15. API Integration Tests

The API routes are tested using Supertest.

The following endpoints are covered:

```text
GET    /tasks
GET    /tasks?status=...
GET    /tasks?page=...&limit=...
GET    /tasks/stats

POST   /tasks

PUT    /tasks/:id

DELETE /tasks/:id

PATCH  /tasks/:id/complete

PATCH  /tasks/:id/assign
```

The API tests also verify:

- Successful requests.
- Invalid requests.
- Validation errors.
- Unknown task IDs.
- Status filtering.
- Pagination.
- Task creation.
- Task updates.
- Task deletion.
- Task completion.
- Task assignment.
- Invalid assignment requests.

---

# 16. Edge-Case Testing

Additional edge cases were tested to reduce the possibility of regressions.

Important edge cases include:

### Status Filtering

```text
progress
```

must not match:

```text
in_progress
```

### Pagination

Page 1 must return the first set of tasks.

### Completion

Completing a high-priority task must not change its priority.

### Assignment

The API must reject:

```text
missing assignee
empty assignee
whitespace-only assignee
```

### Unknown Tasks

Operations on unknown task IDs must return:

```text
404 Not Found
```

These tests improve the reliability of the implementation.

---

# 17. Final Test Results

After implementing the bug fixes, assignment feature, validation, and additional tests, the complete test suite was executed.

Final result:

```text
Test Suites: 2 passed, 2 total
Tests:       38 passed, 38 total
Snapshots:   0 total
Failures:    0
```

All automated tests passed successfully.

---

# 18. Test Coverage

The final coverage report was:

| Metric | Coverage |
|---|---:|
| Statements | 93.54% |
| Branches | 82.55% |
| Functions | 93.33% |
| Lines | 93.19% |

All major coverage metrics are above the 80% target.

This provides confidence that the main application logic, validation, routes, and service behavior are covered by automated tests.

---

# 19. Verification Workflow

The debugging and implementation process followed this workflow:

```text
Review Existing Code
        ↓
Identify Potential Issue
        ↓
Create Reproduction Test
        ↓
Run Test
        ↓
Confirm Failure
        ↓
Identify Root Cause
        ↓
Implement Focused Fix
        ↓
Add Regression Test
        ↓
Run Complete Test Suite
        ↓
Run Coverage
        ↓
Verify Final Result
```

This process was followed for the identified functional bugs.

---

# 20. Main Files Involved

The main implementation and testing files are:

```text
src/
├── app.js
├── routes/
│   └── tasks.js
├── services/
│   └── taskService.js
└── utils/
    └── validators.js

tests/
├── taskService.test.js
└── tasks.test.js
```

Documentation:

```text
README.md
BUG_REPORT.md
```

---

# 21. Final Status

| Item | Status |
|---|---|
| Existing code reviewed | ✅ |
| Pagination bug identified | ✅ |
| Pagination bug fixed | ✅ |
| Pagination regression test | ✅ |
| Partial status bug identified | ✅ |
| Partial status bug fixed | ✅ |
| Partial status regression test | ✅ |
| Completion priority bug identified | ✅ |
| Completion priority bug fixed | ✅ |
| Completion regression test | ✅ |
| Task assignment feature | ✅ |
| Assignee validation | ✅ |
| Assignment error handling | ✅ |
| Reassignment support | ✅ |
| Unit tests | ✅ |
| API integration tests | ✅ |
| Edge-case tests | ✅ |
| 38 tests passing | ✅ |
| 80%+ coverage | ✅ |
| README documentation | ✅ |
| Bug report documentation | ✅ |

---

# 22. Conclusion

The Task API was reviewed, tested, and improved as part of the Full Stack Developer Intern take-home assignment.

Three functional issues were identified:

1. Incorrect pagination offset.
2. Partial status matching.
3. Unintended priority modification when completing a task.

Each issue was reproduced through automated testing before implementing the corresponding fix.

A task assignment feature was also implemented with:

- Input validation.
- Error handling.
- Whitespace normalization.
- Reassignment support.
- API integration tests.

The final implementation was verified using the complete automated test suite.

Final result:

```text
2 test suites passed
38 tests passed
0 tests failed
```

The final coverage exceeded 80% across all major metrics:

```text
Statements: 93.54%
Branches:   82.55%
Functions:  93.33%
Lines:      93.19%
```

The project is ready for final review and deployment.