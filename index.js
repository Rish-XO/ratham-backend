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
    // Check if the token exists in either the deans table or students table
    const query =
      "SELECT * FROM deans WHERE token = $1 UNION ALL SELECT * FROM students WHERE token = $1";
    const result = await pool.query(query, [token]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Attach the result.rows to the req object
    req.tokenData = result.rows;
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
app.get("/dean/slots", validateToken, async (req, res) => {
  try {
    // if authorized check slots
    const slots = await pool.query("SELECT * FROM slots WHERE booked_by IS NULL");
    res.json(slots.rows);
  } catch (error) {
    console.log("from gettin slots", error.message);
  }
});

// slot booking
app.post("/student/booking", validateToken, async (req, res) => {
  const { slotId } = req.body;
  const tokenData = req.tokenData;
  console.log(slotId, tokenData);
  const student = tokenData.user_id;
  const dean = "fdcf4057-ce74-4437-a454-e0f94e67f96f";
  try {
    const booking = await pool.query(
      "INSERT INTO slots (booked_by, booken_for) VALUES($1, $2) WHERE slot_id = $3",
      [student, dean, slotId]
    );
    res.json({status : "booked"})
  } catch (error) {
    console.log(error.message);
  }
});


// to see the pending sessions
app.get("/dean/pending-sessions", validateToken, async (req, res) => {
    const tokenData = req.tokenData
    console.log(tokenData);
    try {
        const slots = await pool.query("SELECT * FROM slots WHERE time_over = $1 AND booked_for = $2",["false", tokenData.user_id])
        console.log(slots.rows);
    } catch (error) {
        console.log(error.message);
    }
})

app.listen(5000, () => {
  console.log("listening on 5000");
});
