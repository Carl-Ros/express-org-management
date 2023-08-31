const express = require("express");
const router = express.Router();
const company_controller = require("../controllers/companyController");

// GET request for list of all companyies.
router.get("/", company_controller.company_list);

// GET request for creating company. NOTE This must come before route for id (i.e. display company).
router.get("/create", company_controller.company_create_get);

// POST request for creating company.
router.post("/create", company_controller.company_create_post);

// GET request to update company.
router.get("/:id/update", company_controller.company_update_get);

// POST request to update company.
router.post("/:id/update", company_controller.company_update_post);

// GET request for one company.
router.get("/:id", company_controller.company_get);


module.exports = router;