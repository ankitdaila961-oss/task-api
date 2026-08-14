# Task API – Full Stack Developer Take-Home Assignment

A RESTful Task Management API built with Node.js and Express.js.

This project was developed as part of a Full Stack Developer Intern take-home assignment. The primary focus of the implementation is not only API functionality, but also identifying existing issues, reproducing them through automated tests, fixing them safely, and maintaining strong test coverage.

---

## 🚀 Project Overview

The Task API provides a simple backend for creating and managing tasks.

The API supports:

- Creating tasks
- Fetching tasks
- Filtering tasks by status
- Paginating tasks
- Updating tasks
- Deleting tasks
- Completing tasks
- Assigning tasks to users
- Task statistics
- Input validation
- Error handling
- Automated unit testing
- API integration testing
- Edge-case testing

The application currently uses in-memory storage, making it lightweight and easy to run locally.

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | Runtime environment |
| Express.js | REST API framework |
| JavaScript | Application logic |
| Jest | Unit testing |
| Supertest | API integration testing |
| UUID | Unique task IDs |

---

## 📁 Project Structure

```text
task-api/
│
├── src/
│   ├── routes/
│   │   └── tasks.js
│   │
│   ├── services/
│   │   └── taskService.js
│   │
│   ├── utils/
│   │   └── validators.js
│   │
│   └── app.js
│
├── tests/
│   ├── .gitkeep
│   ├── taskService.test.js
│   └── tasks.test.js
│
├── BUG_REPORT.md
├── README.md
├── jest.config.js
├── package.json
└── package-lock.json
