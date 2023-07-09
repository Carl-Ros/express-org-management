const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const {Department, Status: DepartmentStatus} = require("./department")

const UserSchema = new Schema({
  givenName: { type: String, required: true, maxLength: 100 },
  surname: { type: String, required: true, maxLength: 100 },
  email: { type: String, unique: true},
  m365License: { type: String},
  manager: {type: Schema.Types.ObjectId, ref: "User"},
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
  if(this.department){
    const department = await Department.findOne({ _id: this.department });
    if (department.status === DepartmentStatus.CLOSED) {
      next(new Error("Department must not be closed."));
    }
    next()
  }
});

// Validate manager
UserSchema.pre('save', async function(next) {
  const errors = [];
  if(this.manager){
      if(this.manager.toString() === this.id.toString()) {
          errors.push(`User cannot reference itself as manager.`);
      }

      const User = mongoose.model('User');
      let manager = await User.findOne({ _id: this.manager });
      let prevManager;
      while(manager.manager){
        prevManager = manager;
        manager = await User.findOne({ _id: manager.manager._id });
        if(manager._id.toString() === this.id.toString()){
          errors.push(`Circular manager relationship is not allowed. The manager ${this.manager._id} has ${prevManager._id} in the reporting line, which has a reference to the current user ${this._id}`);
        }
      }
  }   
  
  if(errors.length > 0){
      const errMsg = errors.join("\n");
      this.invalidate('parent', errMsg);
      next(new Error(errMsg));
  }

  next()
});

UserSchema.virtual("company").get(function () {
  return this.department ? this.department.company : "";
});

UserSchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/users/${this._id}`;
});

UserSchema.virtual("directReports", {
  ref: "User",
  localField: "_id",
  foreignField: "manager",
});

module.exports = mongoose.model("User", UserSchema);