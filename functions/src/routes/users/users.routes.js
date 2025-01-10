// Express
const { Router } = require("express");
const router = Router();

// Middlewares
const usersController = require("./usersController");
const userSchema = require("./userSchema");

// -------------------------------- RUTAS --------------------------------

router.post("/create/user", userSchema.postUser, usersController.postUser);

router.put("/update/user", usersController.putUser); // Falta Schemas

router.get("/get/user", usersController.getUser); // Falta Schemas

router.delete("/delete/user", usersController.deleteUser); // Falta Schemas

module.exports = router;
