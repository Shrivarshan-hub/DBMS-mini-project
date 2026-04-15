const mysql = require('mysql2/promise');

async function initDB() {
    try {
        // 1. First connect without a database to create it if it doesn't exist
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: 'root' // Note: Add your password here if you have one, e.g., '1234'
        });

        await connection.query("CREATE DATABASE IF NOT EXISTS canteen_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        await connection.query("ALTER DATABASE canteen_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
        await connection.end();

        // 2. Connect to the canteen_db
        const pool = mysql.createPool({
            host: 'localhost',
            user: 'root',
            password: 'root',
            database: 'canteen_db',
            charset: 'utf8mb4',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });

        // 3. Create Tables
        await pool.query(`
            CREATE TABLE IF NOT EXISTS Items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                image VARCHAR(500) CHARACTER SET utf8mb4,
                category VARCHAR(100) DEFAULT 'General'
            )
        `);
        // Force add category column if missing
        try { await pool.query("ALTER TABLE Items ADD COLUMN category VARCHAR(100) DEFAULT 'General'"); } catch(e){}
        await pool.query("ALTER TABLE Items CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

        await pool.query(`
            CREATE TABLE IF NOT EXISTS Orders (
                id INT AUTO_INCREMENT PRIMARY KEY,
                total_amount DECIMAL(10, 2) NOT NULL,
                status VARCHAR(50) DEFAULT 'Waiting',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS OrderItems (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT,
                item_id INT,
                quantity INT NOT NULL,
                price DECIMAL(10, 2) NOT NULL,
                FOREIGN KEY (order_id) REFERENCES Orders(id),
                FOREIGN KEY (item_id) REFERENCES Items(id)
            )
        `);

        // 4. Force Reset and Insert Indian/Chinese/Juice items with Real Images
        await pool.query("SET FOREIGN_KEY_CHECKS = 0;");
        await pool.query("TRUNCATE TABLE OrderItems;");
        await pool.query("TRUNCATE TABLE Orders;");
        await pool.query("TRUNCATE TABLE Items;");
        await pool.query("SET FOREIGN_KEY_CHECKS = 1;");

        const items = [
            ['Masala Dosa', 80, '/images/dosa.png', 'South Indian'],
            ['Idli Sambar', 60, '/images/idli.png', 'South Indian'],
            ['Medu Vada', 50, '/images/vada.png', 'South Indian'],
            ['Veg Fried Rice', 120, '/images/fried_rice.png', 'Chinese'],
            ['Watermelon Juice', 40, '/images/watermelon_juice.png', 'Juices']
        ];
        await pool.query("INSERT INTO Items (name, price, image, category) VALUES ?", [items]);

        console.log("✅ MySQL Database Connected and Initialized Successfully!");
        return pool;
    } catch (err) {
        console.error("❌ MySQL Database connection error! Please make sure XAMPP/MySQL Server is running.", err);
    }
}

// Export a promise that resolves to the connection pool
module.exports = initDB();
