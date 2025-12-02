import mysql from 'mysql2';

export const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT),
  maxIdle: Number(process.env.DB_MAX_IDLE),
  idleTimeout: Number(process.env.DB_IDLE_TIMEOUT),
  queueLimit: Number(process.env.DB_QUEUE_LIMIT),
  enableKeepAlive: true,
  keepAliveInitialDelay: Number(process.env.DB_KEEP_ALIVE_INITIAL_DELAY)
});

// Test database connection
db.execute('SELECT 1', (err, results) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log('Database connected successfully!');
  }
});