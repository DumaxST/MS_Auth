// Express
const { Router } = require("express");
const router = Router();

// Middlewares
const usersController = require("./usersController");
const userSchema = require("./userSchema");
const { validateToken } = require("../../middlewares/auth");

// -------------------------------- RUTAS --------------------------------

router.post("/create/user", validateToken, userSchema.postUser, usersController.postUser); //Registro privado

router.put("/update/user", validateToken, usersController.putUser); // Falta Schemas

router.get("/get/user", validateToken, usersController.getUser); // Falta Schemas

router.delete("/delete/user", validateToken, usersController.deleteUser); // Falta Schemas

module.exports = router;
