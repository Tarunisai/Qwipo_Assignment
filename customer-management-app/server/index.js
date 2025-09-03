const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

const accessLogStream = fs.createWriteStream(path.join(logsDir, 'access.log'), { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream })); 

function logErrorToFile(errObj) {
  const file = path.join(logsDir, 'error.log');
  const line = `[${new Date().toISOString()}] ${JSON.stringify(errObj)}\n`;
  fs.appendFile(file, line, (e) => { if (e) console.error('Failed to write error log', e); });
}


// Connect to SQLite database
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error(err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
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



// GET all customers (with addresses_count and only_one_address)
app.get("/api/customers", (req, res) => {
  const {
    search = "",
    sortField = "id",
    sortOrder = "asc",
    page = 1,
    limit = 10,
  } = req.query;

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
        c.first_name LIKE ? 
        OR c.last_name LIKE ? 
        OR c.phone_number LIKE ? 
        OR a.city LIKE ? 
        OR a.state LIKE ? 
        OR a.pin_code LIKE ?
      )`;
    params.push(searchQuery, searchQuery, searchQuery, searchQuery, searchQuery, searchQuery);
  }

  sql += `
    GROUP BY c.id
    ORDER BY ${safeSortField} ${safeSortOrder}
    LIMIT ? OFFSET ?;
  `;
  params.push(limit, offset);

  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ data: rows });
  });
});



// GET single customer (with addresses_count and only_one_address)
app.get('/api/customers/:id', (req, res, next) => {
    const { id } = req.params;
    db.get("SELECT * FROM customers WHERE id = ?", [id], (err, customer) => {
        if (err) {
            logErrorToFile({ message: err.message, route: `/api/customers/${id}` });
            return next(err);
        }
        if (!customer) return res.status(404).json({ error: 'Customer not found' });

        db.get("SELECT COUNT(*) AS cnt FROM addresses WHERE customer_id = ?", [id], (err2, row) => {
            if (err2) {
                logErrorToFile({ message: err2.message, route: `/api/customers/${id}/count` });
                return next(err2);
            }
            const addresses_count = row?.cnt ?? 0;
            const result = {
              id: customer.id,
              first_name: customer.first_name,
              last_name: customer.last_name,
              phone_number: customer.phone_number,
              addresses_count,
              only_one_address: Number(addresses_count) === 1
            };
            res.json({ message: 'success', data: result });
        });
    });
});

// POST create customer
app.post('/api/customers', (req, res, next) => {
    const { first_name, last_name, phone_number } = req.body;
    if (!first_name || !last_name || !phone_number) {
        return res.status(400).json({ error: "All fields are required" });
    }
    const sql = `INSERT INTO customers (first_name, last_name, phone_number) VALUES (?, ?, ?)`;
    db.run(sql, [first_name, last_name, phone_number], function(err) {
        if (err) {
            logErrorToFile({ message: err.message, route: '/api/customers', body: req.body });
            return next(err);
        }
        res.status(201).json({ message: "Customer created", id: this.lastID });
    });
});

// PUT update customer
app.put('/api/customers/:id', (req, res, next) => {
    const { id } = req.params;
    const { first_name, last_name, phone_number } = req.body;
    const sql = `UPDATE customers SET first_name = ?, last_name = ?, phone_number = ? WHERE id = ?`;
    db.run(sql, [first_name, last_name, phone_number, id], function(err) {
        if (err) {
            logErrorToFile({ message: err.message, route: `/api/customers/${id}`, body: req.body });
            return next(err);
        }
        if (this.changes === 0) return res.status(404).json({ error: "Customer not found" });
        res.json({ message: "Customer updated", changes: this.changes });
    });
});

// DELETE customer
app.delete('/api/customers/:id', (req, res, next) => {
    const { id } = req.params;
    db.run("DELETE FROM addresses WHERE customer_id = ?", [id], function(err) {
      if (err) {
        logErrorToFile({ message: err.message, route: `/api/customers/${id}/addresses/delete` });
        return next(err);
      }
      db.run("DELETE FROM customers WHERE id = ?", [id], function(err2) {
        if (err2) {
          logErrorToFile({ message: err2.message, route: `/api/customers/${id}/delete` });
          return next(err2);
        }
        res.json({ message: "Customer and related addresses deleted", changes: this.changes });
      });
    });
});

// POST add address to a customer
app.post('/api/customers/:id/addresses', (req, res, next) => {
    const { id } = req.params;
    const { address_details, city, state, pin_code } = req.body;
    if (!address_details || !city || !state || !pin_code) {
        return res.status(400).json({ error: "All fields are required" });
    }
    const sql = `INSERT INTO addresses (customer_id, address_details, city, state, pin_code) VALUES (?, ?, ?, ?, ?)`;
    db.run(sql, [id, address_details, city, state, pin_code], function(err) {
        if (err) {
            logErrorToFile({ message: err.message, route: `/api/customers/${id}/addresses`, body: req.body });
            return next(err);
        }
        res.status(201).json({ message: "Address added", id: this.lastID });
    });
});

// GET addresses for a customer
app.get('/api/customers/:id/addresses', (req, res, next) => {
    const { id } = req.params;
    db.all("SELECT * FROM addresses WHERE customer_id = ?", [id], (err, rows) => {
        if (err) {
            logErrorToFile({ message: err.message, route: `/api/customers/${id}/addresses` });
            return next(err);
        }
        res.json({ message: "success", data: rows });
    });
});

// PUT update an address
app.put('/api/addresses/:addressId', (req, res, next) => {
    const { addressId } = req.params;
    const { address_details, city, state, pin_code } = req.body;
    const sql = `UPDATE addresses SET address_details = ?, city = ?, state = ?, pin_code = ? WHERE id = ?`;
    db.run(sql, [address_details, city, state, pin_code, addressId], function(err) {
        if (err) {
            logErrorToFile({ message: err.message, route: `/api/addresses/${addressId}`, body: req.body });
            return next(err);
        }
        if (this.changes === 0) return res.status(404).json({ error: "Address not found" });
        res.json({ message: "Address updated", changes: this.changes });
    });
});

// DELETE address
app.delete('/api/addresses/:addressId', (req, res, next) => {
    const { addressId } = req.params;
    db.run("DELETE FROM addresses WHERE id = ?", [addressId], function(err) {
        if (err) {
            logErrorToFile({ message: err.message, route: `/api/addresses/${addressId}/delete` });
            return next(err);
        }
        res.json({ message: "Address deleted", changes: this.changes });
    });
});


app.get('/', (req, res) => res.send('Backend is running. Use /api/* endpoints'));

// Centralized error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  logErrorToFile({ message: err.message, stack: err.stack, route: req.originalUrl, body: req.body });
  res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
