const mongoose = require("mongoose");
const { Department, Status: DepartmentStatus } = require("../../models/department");
const { Company, Status: CompanyStatus } = require("../../models/company");

const assert = require("assert");
const { describe, it, afterEach } = require("node:test");
const db = require("../../db.js")

async function createCompany({ name = "Test Company", code = "0001", status = CompanyStatus.ONBOARDING } = {}) {
  const companyData = {
    name: name,
    code: code,
    status: status
  };
  const newCompany = new Company(companyData);
  return newCompany.save();
}

// TODO:
// geolocation, user 
// should return cities from 2 geolocations
// should return 2 users
// department.status -> closed should remove department from all associated users

describe("Department", () => {
  let cleanupDepartments = [];
  let cleanupCompanies = [];

  afterEach(async () => {
    // Clean up the test objects
    await Promise.all([
      ...cleanupDepartments.map(id => Department.findByIdAndDelete(id)),
      ...cleanupCompanies.map(id => Company.findByIdAndDelete(id))
    ]);

    cleanupDepartments = [];
    cleanupCompanies = [];
  });

  it("Should create a new department with mandatory properties", async () => {
    const newCompany = await createCompany();
    console.log(newCompany);
    cleanupCompanies.push(newCompany._id);

    const departmentData = {
      name: "Test Department",
      company: newCompany._id,
    };

    const newDepartment = new Department(departmentData);
    savedDepartment = await newDepartment.save();
    assert.strictEqual(savedDepartment.name, departmentData.name);
    assert.strictEqual(savedDepartment.company.toString(), newCompany._id.toString());
    cleanupDepartments.push(savedDepartment._id);
  });

  it("should not be able to add with decomissioned company", async () => {
    const newCompany = await createCompany({ status: CompanyStatus.DECOMISSIONED });
    cleanupCompanies.push(newCompany._id);

    const departmentData = {
      name: "Test Department",
      company: newCompany._id,
    };

    const newDepartment = new Department(departmentData);
    try {
      savedDepartment = await newDepartment.save();
      cleanupDepartments.push(savedDepartment._id);
      assert.fail('Error should be thrown due to decomissioned company ref on creation');
    } catch (err) {
      assert.ok(err);
    }
  });


});