var mongoose = require('mongoose');

var KeySchema = new mongoose.Schema({
  id: {
    type: Number,
    unique: true,
    required: true
  },
  key: {
    type: String,
    required: true
  }
});

KeySchema.methods.getUser = async function (id) {
  const user = await mongoose.model('User')
    .findOne({id: id})
    .select('-password')
    .populate(user, '-password')
  return user;
}

module.exports = mongoose.model('Key', KeySchema);
