// Employee App Backend Integration
// The supplied frontend in dist/Frontend is intentionally kept unchanged.

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware: parse JSON requests and serve the supplied frontend files.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'dist', 'Frontend')));

// Employee document structure used by the provided frontend.
const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    position: { type: String, required: true, trim: true },
    salary: { type: Number, required: true, min: 0 }
  },
  { timestamps: true, collection: 'employees' }
);

const Employee = mongoose.model('Employee', employeeSchema);

function isValidEmployeeId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function validateEmployeeFields(body) {
  const requiredFields = ['name', 'location', 'position', 'salary'];
  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || String(body[field]).trim() === '') {
      return `The '${field}' field is required.`;
    }
  }
  if (!Number.isFinite(Number(body.salary)) || Number(body.salary) < 0) {
    return "The 'salary' field must be a non-negative number.";
  }
  return null;
}

// GET: retrieve all employees.
// The /api route is used by the supplied frontend. The legacy alias is kept for compatibility.
async function getAllEmployees(req, res, next) {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.status(200).json(employees);
  } catch (error) {
    next(error);
  }
}
app.get(['/api/employeelist', '/employeelist'], getAllEmployees);

// GET: retrieve one employee by MongoDB document ID.
async function getEmployeeById(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidEmployeeId(id)) {
      return res.status(400).json({ message: 'Invalid employee ID.' });
    }
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }
    res.status(200).json(employee);
  } catch (error) {
    next(error);
  }
}
app.get(['/api/employeelist/:id', '/employeelist/:id'], getEmployeeById);

// POST: add a new employee.
async function createEmployee(req, res, next) {
  try {
    const validationError = validateEmployeeFields(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }
    const employee = await Employee.create({
      name: String(req.body.name).trim(),
      location: String(req.body.location).trim(),
      position: String(req.body.position).trim(),
      salary: Number(req.body.salary)
    });
    res.status(201).json(employee);
  } catch (error) {
    next(error);
  }
}
app.post(['/api/employeelist', '/employeelist'], createEmployee);

// PUT: update an employee. The supplied frontend sends the employee object,
// including its MongoDB _id, in the request body.
async function updateEmployee(req, res, next) {
  try {
    const id = req.body._id || req.body.id;
    if (!id) {
      return res.status(400).json({ message: 'Employee ID (_id) is required in the request body.' });
    }
    if (!isValidEmployeeId(id)) {
      return res.status(400).json({ message: 'Invalid employee ID.' });
    }
    const validationError = validateEmployeeFields(req.body);
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }
    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      {
        name: String(req.body.name).trim(),
        location: String(req.body.location).trim(),
        position: String(req.body.position).trim(),
        salary: Number(req.body.salary)
      },
      { new: true, runValidators: true }
    );
    if (!updatedEmployee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }
    res.status(200).json(updatedEmployee);
  } catch (error) {
    next(error);
  }
}
app.put(['/api/employeelist', '/employeelist'], updateEmployee);

// DELETE: remove one employee by ID.
async function deleteEmployee(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidEmployeeId(id)) {
      return res.status(400).json({ message: 'Invalid employee ID.' });
    }
    const deletedEmployee = await Employee.findByIdAndDelete(id);
    if (!deletedEmployee) {
      return res.status(404).json({ message: 'Employee not found.' });
    }
    res.status(200).json({ message: 'Employee deleted successfully.', employee: deletedEmployee });
  } catch (error) {
    next(error);
  }
}
app.delete(['/api/employeelist/:id', '/employeelist/:id'], deleteEmployee);

// Simple status endpoint for checking whether the backend is reachable.
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Keep the single-page frontend fallback after API routes.
app.get('/*', function (req, res) {
  res.sendFile(path.join(__dirname, 'dist', 'Frontend', 'index.html'));
});

// Central error handler: return JSON for API errors without exposing secrets.
app.use((error, req, res, next) => {
  console.error('Request error:', error.message);
  if (res.headersSent) return next(error);
  const status = error.name === 'ValidationError' ? 400 : 500;
  res.status(status).json({ message: status === 400 ? error.message : 'An unexpected server error occurred.' });
});

async function startServer() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error('Missing MONGODB_URI. Create a .env file using .env.example and add your MongoDB Atlas connection string.');
    process.exitCode = 1;
    return;
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB Atlas.');
    app.listen(PORT, () => {
      console.log(`Employee App is running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Could not connect to MongoDB. Check your Atlas URI, database user, and network access settings.');
    console.error(error.message);
    process.exitCode = 1;
  }
}

startServer();
