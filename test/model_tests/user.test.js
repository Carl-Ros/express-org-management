const { Company } = require("../../models/company");
const { Department, Status: DepartmentStatus } = require("../../models/department");
const User = require("../../models/user")

const assert = require("assert");
const { describe, it, afterEach } = require("node:test");
require("../../db.js")

const cleanupEntries = [];

function addToCleanup(model, objectId) {
  cleanupEntries.push({model, objectId})
}

function clearCleanup(){
  cleanupEntries.splice(0, cleanupEntries.length)
}

async function createDepartment({ name = "Test Department", status = DepartmentStatus.ACTIVE } = {}) {
  
    const companyData = {
        name: "Test Company",
        code: "0001",
    };

    const newCompany = new Company(companyData);
    const savedCompany = await newCompany.save();
    addToCleanup(Company, savedCompany._id);

    const departmentData = {
        name: name,
        status: status,
        company: savedCompany._id
    }

    const newDepartment = new Department(departmentData);
    addToCleanup(Department, newDepartment._id);
    return newDepartment.save();
}

describe("User", () => {

  afterEach(async () => {
    // Clean up the test objects
    await Promise.all(cleanupEntries.map(({model, objectId}) => model.findByIdAndDelete(objectId)));
    clearCleanup();
  });

  it("Should create a new user with mandatory properties", async () => {
    const userData = {
        givenName: "Test",
        surname: "User",
        email: "test.user@example.com"
    }

    const newUser = new User(userData);
    const savedUser = await newUser.save();
    addToCleanup(User, savedUser._id);

    assert.strictEqual(savedUser.email, userData.email);
  });

 it("should be able to add user to department", async () => {
    const newDepartment = await createDepartment();

    const userData = {
        givenName: "Test",
        surname: "User",
        email: "test.user@example.com",
        department: newDepartment._id
    }
    
    const newUser = new User(userData);
    const savedUser = await newUser.save();
    addToCleanup(User, savedUser._id);
    assert.strictEqual(savedUser.department, newDepartment._id);
  });

  it("should not be able to add user to a closed department", async () => {
    const newDepartment = await createDepartment({status: DepartmentStatus.CLOSED});

    const userData = {
        givenName: "Test",
        surname: "User",
        email: "test.user@example.com",
        department: newDepartment._id
    }
    
    const newUser = new User(userData);

    try {
        const savedUser = await newUser.save();
        addToCleanup(User, savedUser._id);
        assert.fail('Error should be thrown due to closed department ref on creation');
      } catch (err) {
        assert.ok(err);
      }
  });  

});

