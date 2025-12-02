// Test database connection with Railway DB
const mysql = require('mysql2/promise');

async function testConnection() {
  console.log('🔍 Testing database connection...');
  
  try {
     const db = mysql.createPool({
      host: "mysql-230c7b65-mor659312-305e44.g.aivencloud.com",
      port: 10719,
      user: "avnadmin",
      password: "AVNS_07nwrHiCqz7letHbBlA",
      database: "defaultdb",
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    console.log('✅ Connected successfully!');
    
    // Test query
    const [rows] = await db.execute("SELECT * FROM user LIMIT 5");
    console.log('📊 Query results:', rows);
    
    await db.end();
    console.log('🔒 Connection closed.');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  }
}

testConnection();