const mysql = require("mysql2/promise");
require("dotenv").config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
});

// pool
//   .getConnection()
//   .then((connection) => {
//     console.log("MySQL connected successfully!");
//     connection.release();
//   })
//   .catch((error) => {
//     console.error("MySQL Error Code:", error.code);
//     console.error("MySQL Error Message:", error.message);
//   });

module.exports = pool;
