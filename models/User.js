const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Create Schema
const UserSchema = new Schema({
  fname: {
    type: String,
    required: true
  },
  lname: {
    type: String,
    required: true
  },
  // username: {
  //   type: String,
  //   required: true,
  //   unique: true
  // },
  email: {
    type: String,
    required: true,
    unique: true
  },
  address: {
    type: String
  },
  phone: {
    type: Number
  },
  password: {
    type: String,
    required: true
  },
  register_date: {
    type: Date,
    default: Date.now
  },
  role: {
    type: Array,
    default: ["user"]
  },
  business: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model("user", UserSchema);
