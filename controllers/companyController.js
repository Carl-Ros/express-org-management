const asyncHandler = require("express-async-handler");
const {Company, Status} = require("../models/company");
const {Department} = require("../models/department");
const User = require("../models/user");
const { body, validationResult } = require("express-validator");
const {Tree} = require("../tree");

// Display detail page for a specific company.
exports.company_get = asyncHandler(async (req, res) => {
    const company = await Company.findById(req.params.id).populate(["departments", "children"]);
    
    const users = await User.find({company: req.params.id}).populate(["directReports", "manager"]);
    const userTree = new Tree(users, "directReports", "manager", "_id", "fullName");
    const treeNodes = userTree.getNodes();



    const locations = await Promise.all(
      company.departments.map( async (department) => {
      const departmentWithGeolocation = await Department.findById(department._id).populate("geolocation");
      if(!departmentWithGeolocation.geolocation){
        return;
      }

      return { 
        latitude: Number(departmentWithGeolocation.geolocation.latitude), 
        longitude: Number(departmentWithGeolocation.geolocation.longitude)
      }
    }));
    const truthyLocations = locations.filter(Boolean);
    res.render("company_get", { title: `${company.name} (${company.code})`, company: company, locations: truthyLocations, googleMapsKey: process.env.GOOGLE_MAPS_API_KEY, treeNodes});
  });
  
  // Display company create form on GET.
  exports.company_create_get = asyncHandler(async (req, res) => {
    const companies = await Company.find({ status: { $ne: Status.DECOMISSIONED } }).exec();
    res.render("forms/company_form", { title: "Create Company", companies: companies});
  });
  
  const postTypes = {
    CREATE: 'create',
    UPDATE: 'update',
  }
  
  // Handle department create on POST.
  function company_post(type) {
    if (type != postTypes.CREATE && type != postTypes.UPDATE) {
      throw Error('company_post must be called with a valid type');
    }
    return [
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
        const company = new Company({
          name: req.body.name,
          code: req.body.code,
          parent: req.body.parent,
          status: req.body.status ? req.body.status : Status.ACTIVE,
        });

        if (type === postTypes.UPDATE) {
          company._id = req.params.id;
        }

        const formData = {
          company: company,
          companies: companies,
          errors: errors.array(),
          statuses: [...Object.values(Status)],
        }
  
        if (type === postTypes.CREATE) {
          formData.title = "Create Company";
        } else if (type === postTypes.UPDATE) {
          formData.title = "Update Company";
        }
    
        if (!errors.isEmpty()) {
          res.render("forms/company_form", formData);
          return;
        } else {
          if (type === postTypes.CREATE) {
            await company.save();
          } else if (type === postTypes.UPDATE) {
            try{
              //await Company.findByIdAndUpdate(req.params.id, company, { runValidators: true });
              await Company.findOneAndUpdate({ _id: req.params.id }, company, { runValidators: true });
            } catch(e) {
              console.log(e);
            }
          }

          res.redirect(company.url);
        }
      })
    ];
  }

  // Handle company create on POST.
  exports.company_create_post = company_post(postTypes.CREATE);
  
  // Display company update form on GET.
  exports.company_update_get = asyncHandler(async (req, res, next) => {
    const companies = await Company.find({ status: { $ne: Status.DECOMISSIONED } }).exec();
    const company = await Company.findById(req.params.id)

    if (company === null) {
        const err = new Error("Company not found");
        err.status = 404;
        return next(err);
    }

    res.render("forms/company_form", { 
      title: "Update Company",
      company: company,
      companies: companies,
      statuses: [...Object.values(Status)],
      googleMapsKey: process.env.GOOGLE_MAPS_API_KEY 
    });
  });
  
  // Handle company update on POST.
  exports.company_update_post = company_post(postTypes.UPDATE)

  exports.company_list = asyncHandler(async (req, res) => {
    const companies = await Company.find({}).sort({ name: "asc"}).populate(["children", "parent"]).exec();
    const companyTree = new Tree(companies, "children", "parent", "_id", "name");
    const treeNodes = companyTree.getNodes();

    res.render("company_list", {title: "Companies", company_list: companies, treeNodes});
  });