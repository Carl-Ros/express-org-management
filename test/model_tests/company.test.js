const mongoose = require("mongoose");
const Company = require("../../models/company");
const assert = require("assert");
const {describe, it, afterEach} = require("node:test");
const db = require("../../db.js")


// TODO: 
// fail create with parent to itself
// fail create with decomissioned parent 
// pass create with two companies referencing as parent - virtual children should return the objects
// department & gelocation - later
describe("Company", () => {
    let cleanupEntries = [];
  
    afterEach(async () => {
      // Clean up the test objects
      await Promise.all(cleanupEntries.map(id => Company.findByIdAndDelete(id)));
      cleanupEntries = [];
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
      cleanupEntries.push(savedCompany._id);
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
        cleanupEntries.push(savedCompany._id);
      });    

      it("should create a new company with a valid parent", async () => {
        const companyParentData = {
          name: "Test Company",
          code: "0001",
        };
    
        const newParentCompany = new Company(companyParentData);
        const savedParentCompany = await newParentCompany.save();
        cleanupEntries.push(savedParentCompany._id);
    
        const companyData = {
          name: "Test Company",
          code: "0002",
          parent: savedParentCompany._id
        };
    
        const newCompany = new Company(companyData);
        const savedCompany = await newCompany.save();


        assert.strictEqual(savedCompany.parent, savedParentCompany._id);
        cleanupEntries.push(savedCompany._id);
      });
      
    it("should not create a new company with invalid code", async () => {
        const companyData = {
          name: "Test Company",
          code: "00001",
        };
    
        try {
            const newCompany = new Company(companyData);
            const savedCompany = await newCompany.save();
            assert.fail('Error should be thrown due to invalid code');
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
        cleanupEntries.push(savedCompany._id);

        try {
            const savedCompany = await newCompany.save();
            assert.fail('Error should be thrown due to duplicate code');
          } catch (err) {
            console.log(err)
            assert.ok(err);
          }
      });
  });