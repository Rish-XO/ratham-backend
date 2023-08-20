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

//student login
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

//dean login
app.post("/dean/login", async (req, res) => {
  const { universityId, password } = req.body;
  try {
    //check if user exists
    const user = await pool.query("SELECT * FROM deans WHERE college_id = $1", [
      universityId,
    ]);
    if (user.rows.length > 0) {
      const token = user.rows[0].token;
      res.json({ token });
    } else {
      // if user doesn't exist create new
      const user = await pool.query(
        "INSERT INTO deans (college_id , password) VALUES ($1 , $2) RETURNING *",
        [universityId, password]
      );
      const token = user.rows[0].token;
      res.json({ token });
    }
  } catch (error) {
    console.log("error from student login", error.message);
  }
});

//get free slots of dean
app.get("/dean/slots", async (req, res) => {
  const token = req.headers.authorization;
  //   console.log(token);
  try {
    const tokenQuery = "SELECT * FROM students WHERE token = $1";
    const tokenResult = await pool.query(tokenQuery, [token]);

    if (tokenResult.rows.length === 0) {
      // Token not authorized
      return res.status(401).json({ error: "Unauthorized" });
    }

    // if authorized check slots
    const slots = await pool.query("SELECT * FROM slots WHERE time_over = $1", [
      "false",
    ]);
    res.json(slots.rows);
  } catch (error) {
    console.log("from gettin slots", error.message);
  }
});

app.listen(5000, () => {
  console.log("listening on 5000");
});
