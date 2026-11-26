require("dotenv").config();

// Mengimpor class Pool dari library pg untuk mengelola kumpulan koneksi (connection pooling)
const { Pool } = require("pg");

// Membuat instance Pool koneksi baru ke database PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

module.exports = pool;
