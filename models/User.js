var mongoose = require('mongoose');
var autoIncrement = require('mongoose-auto-increment');
var bcrypt = require('bcrypt');
var KeySchema = require('./Key');
var BLIDTools = require('../blidTools')

autoIncrement.initialize(mongoose.connection)

var UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  email: {
    type: String,
    unique: true,
    required: true
  },
  rank: {
    type: String,
    required: true,
    default: "Member"
  },
  discord: {
    id: Number,
    email: String,
    name: String
  }
});

UserSchema.plugin(autoIncrement.plugin, { model: 'User', field: 'id', startAt: 1, incrementBy: 1 });

UserSchema.pre('save', function (next) {
  var user = this;
  console.log("saving");
  if (this.isModified('password') || this.isNew) {
    bcrypt.genSalt(10, function (err, salt) {
      if (err) {
        return next(err);
      }
      console.log(salt + "\nwe got da password");
      bcrypt.hash(user.password, salt, function (err, hash) {
        if (err) {
          return next(err);
        }
        console.log(hash + "\nhashed?");
        user.password = hash;
        next();
      });
    });
    KeySchema.create({ id: user.id, key: BLIDTools.generateKey() })
  } else {
    return next();
  }
});

UserSchema.methods.comparePassword = async function (password){
  const user = this;
  console.log(user)
  //Hashes the password sent by the user for login and checks if the hashed password stored in the 
  //database matches the one sent. Returns true if it does else false.
  const compare = await bcrypt.compare(password, user.password);
  return compare;
}

UserSchema.methods.getUser = async function (id) {
  const user = await mongoose.model('User')
    .findOne({id: id})
    .select('-password')
    .populate(user, '-password')
  return user;
}

UserSchema.methods.changeName = async function (name) {
  const user = this;
  user.update({username: name}, {new: true}, function (err) {
    if (err)
      return err;

    return user;
  })
}

UserSchema.methods.associateDiscord = async function (disc) {
  const user = this;
  const toSave = { id: disc._json.id, email: disc._json.email, name: disc._json.username }
  user.discord = toSave;
  await user.save();
  return user;
}

UserSchema.methods.findUserByBLID = async function (id) {
  await mongoose.model('User')
    .findOne({id: id}, function (err, res) {
      if (err || !res) return false;
      return res.username
    })
}

module.exports = mongoose.model('User', UserSchema);
