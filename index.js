const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

const db = mysql.createConnection({
  host: "containers-us-west-31.railway.app",
  user: "root",
  password: "rfuq5wlu6NGuV16eg4tO",
  database: "railway",
  port: "5768",
});

db.connect((err) => {
  if (err) {
    console.log(`Error Connecting to DB ${err}`);
  } else console.log("Connected");
});

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Routes
app.get("/user/:userId", (req, res) => {
  const userId = req.params.userId;

  db.query("SELECT * FROM tb_user WHERE id_user = ?", userId, (err, user) => {
    if (err) {
      console.error("Error retrieving user:", err);
      res.status(500).json({ error: "Error retrieving user" });
    } else {
      if (user.length === 0) {
        res.status(404).json({ error: "User not found" });
      } else {
        db.query(
          "SELECT SUM(CASE WHEN transType = 'income' THEN amount ELSE 0 END) AS total_income, SUM(CASE WHEN transType = 'expense' THEN amount ELSE 0 END) AS total_expense FROM tb_transaction WHERE id_user = ?",
          userId,
          (err, result) => {
            if (err) {
              console.error("Error retrieving transactions:", err);
              res.status(500).json({ error: "Error retrieving transactions" });
            } else {
              const total_income = result[0].total_income || 0;
              const total_expense = result[0].total_expense || 0;
              const balance = total_income - total_expense;

              res.json({
                id_user: user[0].id_user,
                name: user[0].name,
                address: user[0].address,
                balance,
                total_expense,
              });
            }
          }
        );
      }
    }
  });
});

app.post("/user", (req, res) => {
  const { name, address } = req.body;

  db.query(
    "INSERT INTO tb_user (name, address) VALUES (?, ?)",
    [name, address],
    (err, result) => {
      if (err) {
        console.error("Error adding user:", err);
        res.status(500).json({ error: "Error adding user" });
      } else {
        res.json({ id: result.insertId, message: "User added successfully" });
      }
    }
  );
});

app.post("/transaction", (req, res) => {
  const { user_id, transType, amount } = req.body;

  db.query(
    "INSERT INTO tb_trans (id_user, transType, amount) VALUES (?, ?, ?)",
    [user_id, transType, amount],
    (err, result) => {
      if (err) {
        console.error("Error adding transaction:", err);
        res.status(500).json({ error: "Error adding transaction" });
      } else {
        res.json({
          id: result.insertId,
          message: "Transaction added successfully",
        });
      }
    }
  );
});

app.put("/transaction/:transId", (req, res) => {
  const transId = req.params.transId;
  const { user_id, transType, amount } = req.body;

  db.query(
    "UPDATE tb_trans SET id_user = ?, transType = ?, amount = ? WHERE id_trans = ?",
    [user_id, transType, amount, transId],
    (err, result) => {
      if (err) {
        console.error("Error updating transaction:", err);
        res.status(500).json({ error: "Error updating transaction" });
      } else {
        res.json({ id: transId, message: "Transaction updated successfully" });
      }
    }
  );
});

app.delete("/transaction/:transId", (req, res) => {
  const transId = req.params.transId;

  db.query(
    "DELETE FROM tb_trans WHERE id_trans = ?",
    transId,
    (err, result) => {
      if (err) {
        console.error("Error deleting transaction:", err);
        res.status(500).json({ error: "Error deleting transaction" });
      } else {
        res.json({ id: transId, message: "Transaction deleted successfully" });
      }
    }
  );
});

app.listen(port, () => {
  console.log(`Server running in ${port}`);
});
