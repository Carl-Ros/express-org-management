const asyncHandler = require("express-async-handler");
const User = require("../models/user");
const {Tree} = require("../tree");

// Display detail page for a specific user.
exports.user_get = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).populate(["department", "directReports", "manager"]); // add geolocation
    console.log(user)
    res.render("user_get", { title: user.fullName, user: user, company: await user.company});
});

// Display user create form on GET.
exports.user_create_get = asyncHandler(async (req, res) => {
    res.send("NOT IMPLEMENTED: user create GET");
});

// Handle user create on POST.
exports.user_create_post = asyncHandler(async (req, res) => {
    res.send("NOT IMPLEMENTED: user create POST");
});

// Display user delete form on GET.
exports.user_delete_get = asyncHandler(async (req, res) => {
    res.render("NOT IMPLEMENTED: user delete GET");
});

// Handle user delete on POST.
exports.user_delete_post = asyncHandler(async (req, res) => {
    res.send("NOT IMPLEMENTED: user delete POST");
});

// Display user update form on GET.
exports.user_update_get = asyncHandler(async (req, res) => {
    res.send("NOT IMPLEMENTED: user update GET");
});

// Handle user update on POST.
exports.user_update_post = asyncHandler(async (req, res) => {
    res.send("NOT IMPLEMENTED: user update POST");
});

exports.user_list = asyncHandler(async (req, res) => {
    const users = await User.find({}).populate(["directReports", "manager"]).exec();
    users.sort((a, b) => {
        return a.surname.localeCompare(b.surname, "sv");
    })
    const userTree = new Tree(users, "directReports", "manager", "_id", "fullName");
    const treeNodes = userTree.getNodes();

    res.render("user_list", {
        title: "Users", treeNodes
    });
});