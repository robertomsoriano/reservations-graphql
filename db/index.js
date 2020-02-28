const mongoose = require("mongoose");
const Post = require("../models/Post.js");
const User = require("../models/User.js");
const Business = require("../models/Business.js");
const Reservation = require("../models/Reservation.js");
// SET UP Mongoose Promises.
mongoose.Promise = global.Promise;

export const startDB = async () => {
  const options = {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    poolSize: 10, // Maintain up to 10 socket connections
    // If not connected, return errors immediately rather than waiting for reconnect
    bufferMaxEntries: 0
  };

  console.log("MongoDB connection with retry");
  mongoose
    .connect("mongodb://localhost:27017/yoga", options)
    .then(() => {
      console.log("MongoDB is connected");
      return;
    })
    .catch(err => {
      console.log(
        "MongoDB connection unsuccessful, retry after 5 seconds.",
        err
      );
      setTimeout(connectWithRetry, 5000);
    });
  return;
};

export const models = {
  Post,
  User,
  Business,
  Reservation
};
