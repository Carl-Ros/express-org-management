const express = require('express');
const router = express.Router();
const department_controller = require("../controllers/departmentController");

// GET request for list of all departments.
router.get("/", department_controller.department_list);

// GET request for creating department. NOTE This must come before route for id (i.e. display department).
router.get("/create", department_controller.department_create_get);

// POST request for creating department.
router.post("/create", department_controller.department_create_post);

// GET request to delete department.
router.get("/:id/delete", department_controller.department_delete_get);

// POST request to delete department.
router.post("/:id/delete", department_controller.department_delete_post);

// GET request to update department.
router.get("/:id/update", department_controller.department_update_get);

// POST request to update department.
router.post("/:id/update", department_controller.department_update_post);

// GET request for one department.
router.get("/:id", department_controller.department_get);


module.exports = router;
