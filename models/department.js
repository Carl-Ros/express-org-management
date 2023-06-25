const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const DepartmentSchema = new Schema({
  company: { type: Schema.Types.ObjectId, ref: "Company", required: true},
  geolocation: { type: Schema.Types.ObjectId, ref: "Geolocation"},
  name: { type: String, required: true },
  status: {
    type: String,
    required: true,
    enum: ["Active", "Closed"],
    default: "Active",
  }
});

// Virtual for Department's URL
DepartmentSchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/catalog/Department/${this._id}`;
});

// Export model
module.exports = mongoose.model("Department", DepartmentSchema);
