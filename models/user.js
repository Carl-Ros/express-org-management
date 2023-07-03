const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const {Department, Status: DepartmentStatus} = require("./department")

const UserSchema = new Schema({
  givenName: { type: String, required: true, maxLength: 100 },
  surname: { type: String, required: true, maxLength: 100 },
  email: { type: String, unique: true},
  m365License: { type: String},
  department: {type: Schema.Types.ObjectId, ref: "Department"}
});

UserSchema.virtual("fullName").get(function () {
  if (this.givenName && this.surname) {
    return `${this.givenName} ${this.surname}`;
  }
  return "";
});

// Validate department ref
UserSchema.pre('save', async function(next) {
  const department = await Department.findOne({ _id: this.department });
  if (department.status === DepartmentStatus.CLOSED) {
    next(new Error("Department must not be closed."));
  }
  next()
});

UserSchema.virtual("company").get(function () {
  return this.department ? this.department.company : "";
});

UserSchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/catalog/User/${this._id}`;
});

module.exports = mongoose.model("User", UserSchema);
