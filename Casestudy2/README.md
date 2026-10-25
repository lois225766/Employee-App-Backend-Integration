# Employee App Backend Integration

This project completes the backend for the supplied Employee App frontend. The files inside `dist/Frontend` are preserved from the assignment ZIP and should not be edited.

## Requirements
- Node.js and npm
- A MongoDB Atlas account and database

## Setup
1. Open this project folder in VS Code.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to a new file named `.env`.
4. In MongoDB Atlas, create a database user and allow your current IP address under Network Access. Copy the Node.js connection string and put it in `.env` as `MONGODB_URI`. Replace the placeholders locally; do not commit `.env` to GitHub.
5. Start the application:
   ```bash
   npm start
   ```
6. Open `http://localhost:3000` in your browser.

## API endpoints
The frontend uses the `/api` prefix. Compatibility aliases without `/api` are also provided.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/api/employeelist` | Get all employees |
| GET | `/api/employeelist/:id` | Get one employee by MongoDB ID |
| POST | `/api/employeelist` | Add an employee |
| PUT | `/api/employeelist` | Update an employee; include `_id` in the JSON body |
| DELETE | `/api/employeelist/:id` | Delete one employee |
| GET | `/api/health` | Check backend and database status |

### Employee JSON body
```json
{
  "name": "Asha Nair",
  "location": "Kochi",
  "position": "Developer",
  "salary": 45000
}
```
For PUT requests, include the `_id` returned by GET or POST along with these fields.

## Security note
The `.env` file contains the database connection string and must remain private. `.gitignore` excludes it from Git. Only `.env.example` with placeholders should be committed.
