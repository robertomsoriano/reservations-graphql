const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ReservationSchema = new Schema({
  user: {
    type: String,
    required: true
  },
  business: {
    type: String,
    required: true
  },
  service: {
    type: String,
    required: true
  },
  desc: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  createdOn: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    required: true
  },
  log: {
    type: Array,
    required: true
  },
  feedback: {
    type: String
  },
  rating: {
    type: Number
  }
});

module.exports = mongoose.model("Reservation", ReservationSchema);
