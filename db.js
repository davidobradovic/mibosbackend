const mysql = require("mysql2");

const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "", // promijeni ako imaš šifru
  database: "mibos",
});

connection.connect((err) => {
  if (err) throw err;
  console.log("MySQL connected");
});

module.exports = connection;
