const asyncHandler = require("express-async-handler");
const {Company, Status} = require("../models/company")

// Display detail page for a specific company.
exports.company_get = asyncHandler(async (req, res) => {
    const company = await Company.findById(req.params.id).populate(["departments", "children"]);
    const users = [];
    for(const department of company.departments){
        const departmentUsers = await department.populate("users");
        if(departmentUsers.users){
            users.push(...departmentUsers.users);
        }
    }
    
    res.render("company_get", { title: `${company.name} (${company.code})`, company: company, 
    user_list: users.sort((a,b) => {
        return a.surname.localeCompare(b.surname, "sv");
    } )});
  });
  
  // Display company create form on GET.
  exports.company_create_get = asyncHandler(async (req, res) => {
    res.send("NOT IMPLEMENTED: company create GET");
  });
  
  // Handle company create on POST.
  exports.company_create_post = asyncHandler(async (req, res) => {
    res.send("NOT IMPLEMENTED: company create POST");
  });
  
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
    const companies = await Company.find({}).sort({ name: "asc"}).exec();

    res.render("company_list", {title: "Companies", company_list: companies});
  });