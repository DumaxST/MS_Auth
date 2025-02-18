// Express
const { Router } = require("express");
const router = Router();

// Middlewares
const { validateToken } = require("../../middlewares/auth");
const projectController = require("./projectsController");
// const userSchema = require("./userSchema");

// ---------------------------------------- RUTAS ---------------------------------------- 

router.post("/register/projects", projectController.postProject);




module.exports = router;
