const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Logging setup
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);
const accessLogStream = fs.createWriteStream(path.join(logsDir, 'access.log'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));

function logErrorToFile(errObj) {
  const file = path.join(logsDir, 'error.log');
  const line = `[${new Date().toISOString()}] ${JSON.stringify(errObj)}\n`;
  fs.appendFile(file, line, (e) => { if (e) console.error('Failed to write error log', e); });
}

// SQLite database setup
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) console.error(err.message);
    else console.log('Connected to SQLite database.');
});

// Create tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        phone_number TEXT NOT NULL UNIQUE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS addresses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        customer_id INTEGER,
        address_details TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT NOT NULL,
        pin_code TEXT NOT NULL,
        FOREIGN KEY(customer_id) REFERENCES customers(id)
    )`);
});

// -------- API ROUTES --------
// GET all customers
app.get("/api/customers", (req, res) => {
  const { search = "", sortField = "id", sortOrder = "asc", page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  const allowedSortFields = ["id", "first_name", "last_name", "phone_number", "addresses_count"];
  const safeSortField = allowedSortFields.includes(sortField) ? sortField : "id";
  const safeSortOrder = sortOrder.toLowerCase() === "desc" ? "DESC" : "ASC";

  const searchQuery = `%${search}%`;
  let sql = `
    SELECT c.*, COUNT(a.id) AS addresses_count
    FROM customers c
    LEFT JOIN addresses a ON c.id = a.customer_id
    WHERE 1=1
  `;
  const params = [];

  if (!isNaN(search) && search.trim() !== "") {
    sql += ` AND c.id = ?`;
    params.push(Number(search));
  } else if (search.trim() !== "") {
    sql += ` AND (
        c.first_name LIKE ? OR c.last_name LIKE ? OR c.phone_number LIKE ?
        OR a.city LIKE ? OR a.state LIKE ? OR a.pin_code LIKE ?
      )`;
    params.push(searchQuery, searchQuery, searchQuery, searchQuery, searchQuery, searchQuery);
  }

  sql += ` GROUP BY c.id ORDER BY ${safeSortField} ${safeSortOrder} LIMIT ? OFFSET ?`;
  params.push(limit, offset);

  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ data: rows });
  });
});

// GET single customer
app.get('/api/customers/:id', (req, res, next) => {
  const { id } = req.params;
  db.get("SELECT * FROM customers WHERE id = ?", [id], (err, customer) => {
    if (err) return next(err);
    if (!customer) return res.status(404).json({ error: 'Customer not found' });

    db.get("SELECT COUNT(*) AS cnt FROM addresses WHERE customer_id = ?", [id], (err2, row) => {
      if (err2) return next(err2);
      const addresses_count = row?.cnt ?? 0;
      res.json({ message: 'success', data: { ...customer, addresses_count, only_one_address: addresses_count === 1 } });
    });
  });
});

// POST create customer
app.post('/api/customers', (req, res, next) => {
  const { first_name, last_name, phone_number } = req.body;
  if (!first_name || !last_name || !phone_number) return res.status(400).json({ error: "All fields are required" });
  db.run(`INSERT INTO customers (first_name, last_name, phone_number) VALUES (?, ?, ?)`,
    [first_name, last_name, phone_number],
    function(err) {
      if (err) return next(err);
      res.status(201).json({ message: "Customer created", id: this.lastID });
    });
});

// Other API routes (PUT, DELETE, addresses) remain the same as your current code
// ----------------------------

// Serve React build ONLY in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Default route for testing
app.get('/', (req, res) => res.send('Backend is running. Use /api/* endpoints'));

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  logErrorToFile({ message: err.message, stack: err.stack, route: req.originalUrl, body: req.body });
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
