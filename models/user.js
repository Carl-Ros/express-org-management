const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const UserSchema = new Schema({
  givenName: { type: String, required: true, maxLength: 100 },
  surname: { type: String, required: true, maxLength: 100 },
  email: { type: String},
  m365License: { type: String}
});

UserSchema.virtual("fullName").get(function () {
  if (this.givenName && this.surname) {
    return fullname = `${this.givenName} ${this.surname}`;
  }
  return "";
});

// Ensure email is unique before storing
UserSchema.pre('save', function(next) {
  UserSchema.findOne({ email: this.email }, function(err, result) {
    if (err) {
      next(err);
    } else if (result) {
      this.invalidate('email', 'Email must be unique');
      next(new Error('Email must be unique'));
    } else {
      next();
    }
  });
});


UserSchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/catalog/User/${this._id}`;
});

module.exports = mongoose.model("User", UserSchema);
