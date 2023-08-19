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

app.listen(5000, () => {
  console.log("listening on 5000");
});
