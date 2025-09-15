const mongoose = require("mongoose");

function connectDB() {
  return mongoose.connect("mongodb://localhost:27017/globecomponent");
}

module.exports = connectDB;
