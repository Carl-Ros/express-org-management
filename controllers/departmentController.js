const asyncHandler = require("express-async-handler");
const {Department, Status: DepartmentStatus} = require("../models/department")
const {Company, Status: CompanyStatus} = require("../models/company")
const {body, validationResult} = require("express-validator");

// Display detail page for a specific department.
exports.department_get = asyncHandler(async (req, res) => {
    const department = await Department.findById(req.params.id).populate(["users", "company"]); // add geolocation
    res.render("department_get", { title: `${department.company.name} (${department.company.code}) - ${department.name}`, department: department, 
    user_list: department.users.sort((a,b) => {
        return a.surname.localeCompare(b.surname, "sv");
    })});
  });
  
  // Display department create form on GET.
  exports.department_create_get = asyncHandler(async (req, res) => {
    const companies = await Company.find({status: {$ne : CompanyStatus.DECOMISSIONED}}).exec();
    res.render("forms/department_form", { title: "Create Department", companies: companies});
  });
  
  // Handle department create on POST.
  exports.department_create_post = [
    // Validate and sanitize the name field.
    body("name", "Department name must contain at least 2 characters")
      .trim()
      .isLength({ min: 2 })
      .escape(),
    body("company", "Department must have a company")
      .trim()
      .escape()
      .notEmpty(),
  
    // Process request after validation and sanitization.
    asyncHandler(async (req, res) => {
      // Extract the validation errors from a request.
      const errors = validationResult(req);
      const department = new Department({ name: req.body.name, company: req.body.company });
      const companies = await Company.find({status: {$ne : CompanyStatus.DECOMISSIONED}}).exec();
  
      if (!errors.isEmpty()) {
        // There are errors. Render the form again with sanitized values/error messages.
        res.render("forms/department_form", {
          title: "Create Department",
          department: department,
          companies: companies,
          errors: errors.array(),
        });
        return;
      } else {
          await department.save();
          res.redirect(department.url);
      }
    })
  ];
  
  
  // Display department delete form on GET.
  exports.department_delete_get = asyncHandler(async (req, res) => {
    res.render("NOT IMPLEMENTED: department delete GET");
  });
  
  // Handle department delete on POST.
  exports.department_delete_post = asyncHandler(async (req, res) => {
    res.send("NOT IMPLEMENTED: department delete POST");
  });
  
  // Display department update form on GET.
  exports.department_update_get = asyncHandler(async (req, res) => {
    res.send("NOT IMPLEMENTED: department update GET");
  });
  
  // Handle department update on POST.
  exports.department_update_post = asyncHandler(async (req, res) => {
    res.send("NOT IMPLEMENTED: department update POST");
  });

  exports.department_list = asyncHandler(async (req, res) => {
    const departments = await Department.find({}).populate("company").exec();

    res.render("department_list", {title: "Departments", 
    department_list: departments.sort((a,b) => {
        return a.company.name.localeCompare(b.company.name, "sv");
    } )});
});