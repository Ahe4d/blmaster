const mongoose = require('mongoose')

var BLServerSchema = new mongoose.Schema({
  ip: {
    type: String,
    required: true
  },
  port: {
    type: Number,
    required: true
  },
  host: {
    type: String,
    required: true
  },
  blid: {
    type: Number,
    required: true
  },
  passworded: {
    type: Boolean,
    required: true
  },
  dedicated: {
    type: Boolean,
    required: true
  },
  servername: {
    type: String,
    required: true
  },
  players: {
    type: Number,
    required: true
  },
  maxplayers: {
    type: Number,
    required: true
  },
  mapname: {
    type: String,
    required: true
  },
  brickcount: {
    type: Number,
    require: true
  },
  ver: {
    type: Number,
    require: true
  }
});

module.exports = mongoose.model('BLServer', BLServerSchema);
