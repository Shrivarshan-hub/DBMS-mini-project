const express = require('express');
const cors = require('cors');
const dbPromise = require('./database');

const app = express();
app.use(cors());
app.use(express.json());

// A simple wrapper to ensure database is ready before queries run
let db;
dbPromise.then(pool => {
    db = pool;
});

// Get all items for the user dashboard
app.get('/items', async (req, res) => {
    if (!db) return res.status(500).json({ error: "DB not initialized" });
    try {
        const [rows] = await db.query("SELECT * FROM Items");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Place order (used by User Dashboard)
app.post('/place-order', async (req, res) => {
    if (!db) return res.status(500).json({ error: "DB not initialized" });
    const { cart, total } = req.body;
    
    try {
        const [orderResult] = await db.query("INSERT INTO Orders (total_amount) VALUES (?)", [total]);
        const orderId = orderResult.insertId;
        
        for (const item of cart) {
            await db.query("INSERT INTO OrderItems (order_id, item_id, quantity, price) VALUES (?, ?, ?, ?)", 
            [orderId, item.item_id, item.quantity, item.price]);
        }
        
        res.json({ token: orderId, message: "Order Placed Successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all orders (used by Admin Dashboard)
app.get('/orders', async (req, res) => {
    if (!db) return res.status(500).json({ error: "DB not initialized" });
    try {
        const [rows] = await db.query("SELECT * FROM Orders ORDER BY created_at DESC");
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update order status (used by Admin Dashboard)
app.post('/update-status', async (req, res) => {
    if (!db) return res.status(500).json({ error: "DB not initialized" });
    const { order_id, status } = req.body;
    try {
        await db.query("UPDATE Orders SET status = ? WHERE id = ?", [status, order_id]);
        res.json({ success: true, message: "Status updated" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Endpoint to view database tables content easily for DBMS project demo
app.get('/debug/db', async (req, res) => {
    if (!db) return res.status(500).json({ error: "DB not initialized" });
    try {
        const [items] = await db.query("SELECT * FROM Items");
        const [orders] = await db.query("SELECT * FROM Orders");
        const [orderItems] = await db.query("SELECT * FROM OrderItems");
        res.json({ Items: items, Orders: orders, OrderItems: orderItems });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Canteen backend running on http://localhost:${PORT}`);
});
