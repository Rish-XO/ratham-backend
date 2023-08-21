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

// middleware for token handling
const validateToken = async (req, res, next) => {
  const token = req.headers.authorization;

  try {
    // Check if the token exists in either the deans users table
    const query = "SELECT * FROM users WHERE token = $1";
    const result = await pool.query(query, [token]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Attach the result.rows to the req object
    req.tokenData = result.rows[0];
    // Token is authorized, continue to the next middleware or route handler
    next();
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "An error occurred" });
  }
};

//student login
app.post("/student/login", async (req, res) => {
  const { universityId, password } = req.body;
  try {
    //check if user exists
    const user = await pool.query(
      "SELECT * FROM users WHERE college_id = $1 AND role = $2",
      [universityId, "student"]
    );
    if (user.rows.length > 0) {
      const token = user.rows[0].token;
      res.json({ token });
    } else {
      // if user doesn't exist create new
      const user = await pool.query(
        "INSERT INTO users (college_id , password, role) VALUES ($1 , $2, $3) RETURNING *",
        [universityId, password, "student"]
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
    const user = await pool.query(
      "SELECT * FROM users WHERE college_id = $1 AND role = $2",
      [universityId, "dean"]
    );
    if (user.rows.length > 0) {
      const token = user.rows[0].token;
      res.json({ token });
    } else {
      // if user doesn't exist create new
      const user = await pool.query(
        "INSERT INTO users (college_id , password, role) VALUES ($1 , $2, $3) RETURNING *",
        [universityId, password, dean]
      );
      const token = user.rows[0].token;
      res.json({ token });
    }
  } catch (error) {
    console.log("error from student login", error.message);
  }
});

//get free slots of dean
app.get("/dean/slots", validateToken, async (req, res) => {
  try {
    // if authorized check slots
    const slots = await pool.query(
      "SELECT * FROM slots WHERE booked_by IS NULL"
    );
    res.json(slots.rows);
  } catch (error) {
    console.log("from gettin slots", error.message);
  }
});

// slot booking
app.post("/student/booking", validateToken, async (req, res) => {
  const { slotId } = req.body;
  const tokenData = req.tokenData;
  const student = tokenData.user_id;
  console.log(slotId, tokenData, student);
  // consider this dean id will be sent from frontend by user
  const dean = "0b6411d2-8fab-4159-b0a2-f78773fc0c02";
  try {
    const booking = await pool.query(
      "UPDATE slots SET booked_by = $1, booked_for = $2 WHERE slot_id = $3",
      [student, dean, slotId]
    );

    if (booking.rowCount === 0) {
      return res
        .status(400)
        .json({ error: "Slot is already booked or doesn't exist" });
    }

    res.json({ status: "booked" });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "An error occurred" });
  }
});

// to see the pending sessions
app.get("/dean/pending-sessions", validateToken, async (req, res) => {
  const tokenData = req.tokenData;
  console.log(tokenData);
  try {
    const slots = await pool.query(
      "SELECT * FROM slots WHERE time_over = $1 AND booked_for = $2",
      ["false", tokenData.user_id]
    );
    console.log(slots.rows);
    res.json({ slots: slots.rows });
  } catch (error) {
    console.log(error.message);
  }
});

app.listen(5000, () => {
  console.log("listening on 5000");
});
