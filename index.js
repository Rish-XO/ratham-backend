const pool = require("./db");
const express = require("express");
const app = express();
const cors = require("cors");

// psql connection
pool.connect();

// base middlewares
app.use(cors());
app.use(express.json());

// home page
app.get("/", (req, res) => {
  res.send("Hello world");
});

app.post("/student/login", async (req, res) => {
  const { universityId, password } = req.body;
  try {
    //check if user exists
    const user = await pool.query(
      "SELECT * FROM students WHERE college_id = $1",
      [universityId]
    );
    if (user.rows.length > 0) {
      const token = user.rows[0].token;
      res.json({ token });
    } else {
      // if user doesn't exist create new
      const user = await pool.query(
        "INSERT INTO students (college_id , password) VALUES ($1 , $2) RETURNING *",
        [universityId, password]
      );
      const token = user.rows[0].token;
      res.json({ token });
    }
  } catch (error) {
    console.log("error from student login", error.message);
  }
});

app.listen(5000, () => {
  console.log("listening on 5000");
});
