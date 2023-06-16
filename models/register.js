const mongoose = require("mongoose");

const Register = mongoose.model("Register", {
  name: String,
  email: String,
  mobile: Number,
  password: String,
});

module.exports = Register;
