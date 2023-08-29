const { Company, Status: CompanyStatus } = require("../../models/company");
const { Department, Status: DepartmentStatus } = require("../../models/department");
const User = require("../../models/user");

const assert = require("assert");
const { describe, it, afterEach } = require("node:test");
require("../../db.js")

async function createCompany({ name = "Test Company", code = "0001", status = CompanyStatus.ONBOARDING } = {}) {
  const companyData = {
    name: name,
    code: code,
    status: status
  };
  const newCompany = new Company(companyData);
  return newCompany.save();
}

const cleanupEntries = [];

function addToCleanup(model, objectId) {
  cleanupEntries.push({model, objectId})
}

function clearCleanup(){
  cleanupEntries.splice(0, cleanupEntries.length)
}

// TODO:
// department.status -> closed should remove department from all associated users

describe("Department", () => {

  afterEach(async () => {
    // Clean up the test objects
    await Promise.all(cleanupEntries.map(({model, objectId}) => model.findByIdAndDelete(objectId)));
    clearCleanup();
  });

  it("Should create a new department with mandatory properties", async () => {
    const newCompany = await createCompany();
    addToCleanup(Company, newCompany._id);

    const departmentData = {
      name: "Test Department",
      company: newCompany._id,
    };

    const newDepartment = new Department(departmentData);
    const savedDepartment = await newDepartment.save();
    assert.strictEqual(savedDepartment.name, departmentData.name);
    assert.strictEqual(savedDepartment.company.toString(), newCompany._id.toString());
    addToCleanup(Department, savedDepartment._id);
  });

 it("should not be able to add with decomissioned company", async () => {
   const newCompany = await createCompany({ status: CompanyStatus.DECOMISSIONED });
   addToCleanup(Company, newCompany._id);
   const departmentData = {
     name: "Test Department",
     company: newCompany._id,
   };

   const newDepartment = new Department(departmentData);
   try {
     const savedDepartment = await newDepartment.save();
     addToCleanup(Department, savedDepartment._id);
     assert.fail('Error should be thrown due to decomissioned company ref on creation');
   } catch (err) {
     assert.ok(err);
   }
  });

  it("should remove users from the department on close status", async () => {
    const newCompany = await createCompany();
    addToCleanup(Company, newCompany._id);

    const departmentData = {
      name: "Test Department",
      company: newCompany._id,
    };

    const newDepartment = new Department(departmentData);
    const savedDepartment = await newDepartment.save();
    addToCleanup(Department, savedDepartment._id);

    const userData = {
      givenName: "Test",
      surname: "User",
      email: "test.user@example.com",
      department: savedDepartment,
    } 

    const newUser = new User(userData);
    const savedUser = await newUser.save();
    addToCleanup(User, savedUser._id);

    console.log(`savedUser: ${savedUser.department._id} --- savedDepartment ${savedDepartment._id}`)
    assert.strictEqual(savedUser.department._id, savedDepartment._id);

    savedDepartment.status = DepartmentStatus.CLOSED;
    await savedDepartment.save();
    
    const changedUser = await User.findById(savedUser._id);
    console.log(changedUser)
    assert.strictEqual(changedUser.department, null);

   });

});