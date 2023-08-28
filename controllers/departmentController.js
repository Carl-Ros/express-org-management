const asyncHandler = require("express-async-handler");
const { Department, Status: DepartmentStatus } = require("../models/department")
const { Company, Status: CompanyStatus } = require("../models/company")
const Geolocation = require("../models/geolocation");
const { body, validationResult } = require("express-validator");

// Display detail page for a specific department.
exports.department_get = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id).populate(["users", "company", "geolocation"]);
  res.render("department_get", {
    title: `${department.company.name} (${department.company.code}) - ${department.name}`, department: department,
    user_list: department.users.sort((a, b) => {
      return a.surname.localeCompare(b.surname, "sv");
    }),
    geolocation: department.geolocation,
    googleMapsKey: process.env.GOOGLE_MAPS_API_KEY,
  });
});

// Display department create form on GET.
exports.department_create_get = asyncHandler(async (req, res) => {
  const companies = await Company.find({ status: { $ne: CompanyStatus.DECOMISSIONED } }).exec();
  res.render("forms/department_form", { title: "Create Department", companies: companies, googleMapsKey: process.env.GOOGLE_MAPS_API_KEY });
});

const postTypes = {
  CREATE: 'create',
  UPDATE: 'update',
}

// Handle department create on POST.
function department_post(type) {
  if (type != postTypes.CREATE && type != postTypes.UPDATE) {
    throw Error('department_post must be called with a valid type');
  }
  return [
    // Validate and sanitize the name field.
    body("name", "Department name must contain at least 2 characters")
      .trim()
      .isLength({ min: 2 })
      .escape(),
    body("company", "Department must have a company")
      .trim()
      .escape()
      .notEmpty(),

    asyncHandler(async (req, res) => {
      const errors = validationResult(req);
      const location = new Geolocation({ latitude: req.body.latitude, longitude: req.body.longitude });
      const department = new Department({ name: req.body.name, company: req.body.company});
      const companies = await Company.find({ status: { $ne: CompanyStatus.DECOMISSIONED } }).exec();

      if (type === postTypes.UPDATE) {
        department._id = req.params.id;
      }

      const formData = {
        department: department,
        companies: companies,
        errors: errors.array(),
      }

      if (type === postTypes.CREATE) {
        formData.title = "Create Department";
      } else if (type === postTypes.UPDATE) {
        formData.title = "Update Department";
      }

      if (!errors.isEmpty()) {
        res.render("forms/department_form", formData);
        return;
      } else {
        await location.save();
        if (type === postTypes.CREATE) {
          await department.save();
        } else if (type === postTypes.UPDATE) {
          await Department.findByIdAndUpdate(req.params.id, department, {});
        }

        res.redirect(department.url);
      }
    })
  ];
}

exports.department_create_post = department_post(postTypes.CREATE);

// Display department update form on GET.
exports.department_update_get = asyncHandler(async (req, res, next) => {
  const companies = await Company.find({ status: { $ne: CompanyStatus.DECOMISSIONED } }).exec();
  const department = await Department.findById(req.params.id);
  const geolocation = await Geolocation.findById(department.geolocation);

  if (department === null) {
      const err = new Error("Department not found");
      err.status = 404;
      return next(err);
  }
  res.render("forms/department_form", { title: "Update Department", department: department, geolocation: geolocation, companies: companies, googleMapsKey: process.env.GOOGLE_MAPS_API_KEY });
});

// Handle department update on POST.
exports.department_update_post = department_post(postTypes.UPDATE);

exports.department_list = asyncHandler(async (req, res) => {
  const departments = await Department.find({}).populate(["company"]).exec();
  res.render("department_list", {
    title: "Departments",
    department_list: departments.sort((a, b) => {
      return a.company.name.localeCompare(b.company.name, "sv");
    })
  });
});