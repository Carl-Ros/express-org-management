const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const Status = {
    ACTIVE: 'active',
    DECOMISSIONED: 'decomissioned',
    ONBOARDING: 'onboarding'
};

const CompanySchema = new Schema({
  parent: { type: Schema.Types.ObjectId, ref: "Company"},
  // geolocation: { type: [Schema.Types.ObjectId], ref: "Geolocation"}, this should be virtual from department
  name: { type: String, required: true },
  code: { type: String, required: true, min:4, max:4, unique:true},
  status: {
    type: String,
    required: true,
    enum: [Status.ACTIVE, Status.DECOMISSIONED, Status.ONBOARDING],
    default: Status.ONBOARDING,
  }
});

// Validate company code
CompanySchema.pre('save', function(next) {
    // ensure numeric string
    if(this.code.length <= 0 || this.code.length > 4 || !this.code.match(/^[0-9]+$/)) {
        this.invalidate('code', `Company code is of wrong format, expected 4 digit numeric string, got ${this.code}`);
        next(new Error(`Company code is of wrong format, expected 4 digit numeric string, got ${this.code}`));
    } else {
        const paddedCode = "0000" + this.code;
        this.code = paddedCode.slice(paddedCode.length-4);
        next()
    }
  });

// Validate company parent
CompanySchema.pre('save', async function(next) {
    const errors = [];
    if(this.parent){
        if(this.parent.toString() === this.id.toString()) {
            errors.push(`Company cannot reference itself as parent.`);
        }
        const Company = mongoose.model('Company');
        const parentCompany = await Company.findOne({ _id: this.parent });

        if (parentCompany.status === Status.DECOMISSIONED) {
          errors.push(`Company parent must not be decomissioned.`);
        }
    }   
    
    if(errors.length > 0){
        const errMsg = errors.join("\n");
        this.invalidate('parent', errMsg);
        next(new Error(errMsg));
    }

    next()
  });

// Close associated departments on company decomission
CompanySchema.pre('save', async function(next) {
  if(this.status === Status.DECOMISSIONED){
    const company = await this.populate('departments')
    for(const department of company.departments){
      // TODO: Fix circular dependecy to be able to use department models enum Status instead
      department.status = "closed";
      await department.save();
      // set department to closed and remove company association
    }
  }
  next();

});


// Virtual for Company's URL
CompanySchema.virtual("url").get(function () {
  // We don't use an arrow function as we'll need the this object
  return `/catalog/Company/${this._id}`;
});

CompanySchema.virtual("children", {
    ref: "Company",
    localField: "_id",
    foreignField: "parent",
  });

CompanySchema.virtual("departments", {
    ref: "Department",
    localField: "_id",
    foreignField: "company",
});

CompanySchema.virtual("geolocations", {
    ref: "Department",
    localField: "_id",
    foreignField: "company",
});

const Company = mongoose.model("Company", CompanySchema);
// Export model
module.exports = {
    Company,
    Status
}
