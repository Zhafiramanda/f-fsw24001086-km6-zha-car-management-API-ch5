const cors = require("cors");
const express = require("express");
const colors = require("colors");
const bp = require("body-parser");
const passport = require("passport");
const { connect } = require("mongoose");
const { success, error } = require("consola");

const { DB, PORT } = require("./config/db");

// Initialize the application
const app = express();

// Middlewares
app.use(cors());
app.use(bp.json());
app.use(passport.initialize());

require("./middlewares/passport")(passport);

// User Router Middleware
app.use("/api/users", require("./routes/users"));

const startApp = async () => {
  try {
    // Connection With DB
    await connect(DB, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });

    success({
      message: `Successfully connected with the Database \n${DB}`,
      badge: true,
    });

    // koneksi port
    app.listen(PORT, () => {
      console.log(`Server running on ${PORT}`.yellow.bgWhite);
    });
  } catch (err) {
    error({
      message: `Error connecting to the database: ${err}`,
      badge: true,
    });
    process.exit(1);
  }
};

startApp();
