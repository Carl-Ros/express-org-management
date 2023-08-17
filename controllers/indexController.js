const {Company, Status: CompanyStatus} = require("../models/company");
const User = require("../models/user");
const {Department} = require("../models/department");
const asyncHandler = require("express-async-handler");
const { Tree } = require("../tree");


exports.index = asyncHandler(async (req, res) => {
    const [
        numCompanies,
        numDepartments,
        numUsers,
        usersWithoutDepartment,
        departmentsWithDecomissionedCompany
    ] = await Promise.all([
        Company.countDocuments({}).exec(),
        Department.countDocuments({}).exec(),
        User.countDocuments({}).exec(),
        User.find({department: null}).exec(),
        Company.find({status:CompanyStatus.DECOMISSIONED}).populate("departments").exec(),
    ]);

    const users = await User.find({}).populate(["directReports", "manager"]).exec();
    users.sort((a, b) => {
        return a.surname.localeCompare(b.surname, "sv");
    });
    const userTree = new Tree(users, "directReports", "manager", "_id", "fullName");
    const userTreeNodes = userTree.getNodes();

    console.log(departmentsWithDecomissionedCompany)
    res.render("index", {
        title: "Org management portal",
        userTreeNodes,
        company_count: numCompanies,
        department_count: numDepartments,
        user_count: numUsers,
        users_without_departments: usersWithoutDepartment,
        departments_with_decomissioned_company: departmentsWithDecomissionedCompany
    });

});