const asyncHandler = require("express-async-handler");
const {Company, Status} = require("../models/company");
const User = require("../models/user");
const { body, validationResult } = require("express-validator");
const {Tree} = require("../tree");

// Display detail page for a specific company.
exports.company_get = asyncHandler(async (req, res) => {
    const company = await Company.findById(req.params.id).populate(["departments", "children"]);
    
    const users = await User.find({company: req.params.id}).populate(["directReports", "manager"]);
    const userTree = new Tree(users, "directReports", "manager", "_id", "fullName");
    const treeNodes = userTree.getNodes();

    res.render("company_get", { title: `${company.name} (${company.code})`, company: company, treeNodes});
  });
  
  // Display company create form on GET.
  exports.company_create_get = asyncHandler(async (req, res) => {
    const companies = await Company.find({ status: { $ne: Status.DECOMISSIONED } }).exec();
    res.render("forms/company_form", { title: "Create Company", companies: companies});
  });
  
  
  // Handle company create on POST.
  exports.company_create_post = [
    // Validate and sanitize the name field.
    body("name", "Company name must contain at least 2 characters")
      .trim()
      .isLength({ min: 2 })
      .escape(),
    body("code", "Company code must be 4 digits, prefixed with zeroes e.g. '0001'")
      .trim()
      .isLength({min: 4, max: 4}),
    body("parent", "parent must be active")
      .trim()
      .custom(async value => {
        if(value){
          const parent = await Company.find({ 
            status: { $ne: Status.DECOMISSIONED },
            id: value
          }).exec();

          if (!parent) {
            throw new Error('Parent company missing or decommissioned');
          }
        }
      }),
  
    asyncHandler(async (req, res) => {
      const errors = validationResult(req);
      const companies = await Company.find({ status: { $ne: Status.DECOMISSIONED } }).exec();
      const company = new Company({ name: req.body.name,code: req.body.code, parent: req.body.parent});

  
      if (!errors.isEmpty()) {
        res.render("forms/company_form", {
          title: "Create Company",
          companies: companies,
          errors: errors.array(),
        });
        return;
      } else {
        // await location.save();
        await company.save();
        res.redirect(company.url);
      }
    })
  ];
  
  // Display company delete form on GET.
  exports.company_delete_get = asyncHandler(async (req, res) => {
    res.render("NOT IMPLEMENTED: company delete GET");
  });
  
  // Handle company delete on POST.
  exports.company_delete_post = asyncHandler(async (req, res) => {
    res.send("NOT IMPLEMENTED: company delete POST");
  });
  
  // Display company update form on GET.
  exports.company_update_get = asyncHandler(async (req, res) => {
    res.send("NOT IMPLEMENTED: company update GET");
  });
  
  // Handle company update on POST.
  exports.company_update_post = asyncHandler(async (req, res) => {
    res.send("NOT IMPLEMENTED: company update POST");
  });

  exports.company_list = asyncHandler(async (req, res) => {
    const companies = await Company.find({}).sort({ name: "asc"}).populate(["children", "parent"]).exec();
    const companyTree = new Tree(companies, "children", "parent", "_id", "name");
    const treeNodes = companyTree.getNodes();

    res.render("company_list", {title: "Companies", company_list: companies, treeNodes});
  });