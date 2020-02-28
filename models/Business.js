const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const BusinessSchema = new Schema({
  user: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: Number
  },
  categories: {
    type: Array
  },
  services: {
    type: Array,
    required: true
  },
  register_date: {
    type: Date,
    default: Date.now
  },
  role: {
    type: Array,
    required: true,
    default: ["business"]
  }
});

module.exports = mongoose.model("Business", BusinessSchema);
