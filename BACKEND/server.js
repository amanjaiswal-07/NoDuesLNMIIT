/**
 * server.js — backend entry point.
 * Loads environment variables, connects to MongoDB (config/db.js), then starts the
 * Express app from app.js on PORT (Render sets this). Kept tiny on purpose so tests
 * can import app.js without opening a database connection or a port.
 */

require('dotenv').config();
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

/**
 * Connect to MongoDB first, then start listening.
 */
async function startServer() {
  await connectDB();
  const app = require('./app');
  app.listen(PORT, () => {
    console.log(`✅ No Dues API running on port ${PORT}`);
  });
}

startServer();
