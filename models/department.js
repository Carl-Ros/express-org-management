const mongoose = require("mongoose");
const {Company, Status: CompanyStatus} = require("./company");

const Schema = mongoose.Schema;

const Status = {
  ACTIVE: 'active',
  CLOSED: 'closed'
};

const DepartmentSchema = new Schema({
  company: { type: Schema.Types.ObjectId, ref: "Company", required: true},
  geolocation: { type: [Schema.Types.ObjectId], ref: "Geolocation"},
  name: { type: String, required: true },
  status: {
    type: String,
    required: true,
    enum: [Status.ACTIVE, Status.CLOSED],
    default: Status.ACTIVE,
  }
});

// Validate company ref
DepartmentSchema.pre('save', async function(next) {
  const company = await Company.findOne({ _id: this.company });
  if (company.status === CompanyStatus.DECOMISSIONED) {
    next(new Error("Company must not be decomissioned."));
  }
  next()
});

// Virtual for Department's URL
DepartmentSchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/departments/${this._id}`;
});

DepartmentSchema.virtual('cities', {
  ref: 'Geolocation',
  localField: 'geolocation',
  foreignField: '_id',
  options: { select: 'city' }
});

DepartmentSchema.virtual('users', {
  ref: 'User',
  localField: '_id',
  foreignField: 'department'
});


// Export model
module.exports = {Department: mongoose.model("Department", DepartmentSchema), Status};
