const {Department, Status: DepartmentStatus} = require("../../models/department");
const {Company, Status: CompanyStatus} = require("../../models/company");
const User = require("../../models/user")

const assert = require("assert");
const {describe, it, afterEach} = require("node:test");
require("../../db.js")

const cleanupEntries = [];

function addToCleanup(model, objectId) {
  cleanupEntries.push({model, objectId})
}

function clearCleanup(){
  cleanupEntries.splice(0, cleanupEntries.length)
}

// TODO:
// department & geolocation - later
describe("Company", () => {

    afterEach(async () => {
      // Clean up the test objects
      await Promise.all(cleanupEntries.map(({model, objectId}) => model.findByIdAndDelete(objectId)));
      clearCleanup();
    });
  
    it("should create a new company with valid code", async () => {
      const companyData = {
        name: "Test Company",
        code: "0001",
      };
  
      const newCompany = new Company(companyData);
      const savedCompany = await newCompany.save();
  
      assert.strictEqual(savedCompany.name, companyData.name);
      assert.strictEqual(savedCompany.code, companyData.code);
      addToCleanup(Company,savedCompany._id);
    });

    it("should create a new company with paddable code", async () => {
        const companyData = {
          name: "Test Company",
          code: "001",
        };
    
        const newCompany = new Company(companyData);
        const savedCompany = await newCompany.save();
    
        assert.strictEqual(savedCompany.name, companyData.name);
        assert.strictEqual(savedCompany.code, '0001');
        addToCleanup(Company,savedCompany._id);
      });    

      it("should create a new company with a valid parent", async () => {
        const companyParentData = {
          name: "Test Company",
          code: "0001",
        };
    
        const newParentCompany = new Company(companyParentData);
        const savedParentCompany = await newParentCompany.save();
        addToCleanup(Company,savedParentCompany._id);
    
        const companyData = {
          name: "Test Company",
          code: "0002",
          parent: savedParentCompany._id
        };
    
        const newCompany = new Company(companyData);
        const savedCompany = await newCompany.save();


        assert.strictEqual(savedCompany.parent, savedParentCompany._id);
        addToCleanup(Company,savedCompany._id);
      });
      
    it("should have accessible virtual children as a valid parent", async () => {
      const companyParentData = {
        name: "Test Company",
        code: "0001",
      };
  
      const newParentCompany = new Company(companyParentData);
      const savedParentCompany = await newParentCompany.save();
      addToCleanup(Company,savedParentCompany._id);
  
      const companyData = {
        name: "Test Company",
        code: "0002",
        parent: savedParentCompany._id
      };
  
      const newCompany = new Company(companyData);
      const savedCompany = await newCompany.save();
      addToCleanup(Company,savedCompany._id);
      
      const companyData2 = {
        name: "Test Company",
        code: "0003",
        parent: savedParentCompany._id
      };
  
      const newCompany2 = new Company(companyData2);
      const savedCompany2 = await newCompany2.save();
      addToCleanup(Company,savedCompany2._id);

      const companyWithChildren = await Company.findById(savedParentCompany._id).populate('children')

      for(const child of companyWithChildren.children){
        assert.strictEqual(child.parent.toString(), companyWithChildren._id.toString())
      }

    });      

    it("should not create a new company with invalid code", async () => {
        const companyData = {
          name: "Test Company",
          code: "00001",
        };
    
        try {
            const newCompany = new Company(companyData);
            await newCompany.save();
            assert.fail('Error should be thrown due to invalid code');
          } catch (err) {
            assert.ok(err);
          }
      });

      it("should not save company with a parent reference to itself", async () => {
        const companyData = {
          name: "Test Company",
          code: "0001",
        };
    
        const newCompany = new Company(companyData);
        const savedCompany = await newCompany.save();
        addToCleanup(Company,savedCompany._id);

        try {
            savedCompany.parent = savedCompany._id;
            await savedCompany.save();
            assert.fail('Error should be thrown due to parent reference to iself');
          } catch (err) {
            assert.ok(err);
          }
      });      

      it("should not save company with a decomissioned parent", async () => {
        const companyParentData = {
          name: "Test Company",
          code: "0001",
          status: CompanyStatus.DECOMISSIONED
        };
    
        const newParentCompany = new Company(companyParentData);
        const savedParentCompany = await newParentCompany.save();
        addToCleanup(Company,savedParentCompany._id);


        const companyData = {
          name: "Test Company",
          code: "0002",
          parent: savedParentCompany._id
        };
    
        try {
            const newCompany = new Company(companyData);
            const savedCompany = await newCompany.save();
            addToCleanup(Company,savedCompany._id);
            assert.fail('Error should be thrown due to decomissioned parent');
          } catch (err) {
            assert.ok(err);
          }
      }); 

      it("should not create a new company with a duplicate code", async () => {
        const companyData = {
          name: "Test Company",
          code: "0001",
        };
        const newCompany = new Company(companyData);
        const savedCompany = await newCompany.save();
        addToCleanup(Company,savedCompany._id);

        try {
            const newCompany2 = new Company(companyData)
            const savedCompany2 = await newCompany2.save();
            addToCleanup(Company,savedCompany2._id);
            assert.fail('Error should be thrown due to duplicate code');
          } catch (err) {
            assert.ok(err);
          }
      });

     it("should close associated department on decomission", async () => {
      const companyData = {
        name: "Test Company",
        code: "0001",
      };

      const newCompany = new Company(companyData);
      const savedCompany = await newCompany.save();
      addToCleanup(Company, savedCompany._id);

      const departmentData = {
        name: "Test Department",
        company: newCompany._id,
      };
  
      const newDepartment = new Department(departmentData);
      const savedDepartment = await newDepartment.save();
      addToCleanup(Department, savedDepartment._id);

      assert.strictEqual(savedDepartment.status, DepartmentStatus.ACTIVE);
      assert.strictEqual(savedDepartment.company.toString(), savedCompany._id.toString());

      savedCompany.status = CompanyStatus.DECOMISSIONED;
      await savedCompany.save();

      const updatedDepartment = await Department.findById(savedDepartment._id)
      assert.strictEqual(updatedDepartment.status, DepartmentStatus.CLOSED);
     });
  });