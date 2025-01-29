// Express
const { Router } = require("express");
const router = Router();

// Middlewares
const { validateToken } = require("../../middlewares/auth");
const usersController = require("./usersController");
const userSchema = require("./userSchema");

// ---------------------------------------- RUTAS ---------------------------------------- 

router.post("/create/user", validateToken, userSchema.postUser, usersController.postUser);

router.put("/update/user", validateToken, userSchema.putUser, usersController.putUser);

router.get("/get/user", validateToken,  userSchema.getUser, usersController.getUser);

router.delete("/delete/user", userSchema.deleteUser, usersController.deleteUser);


//public user
router.post("/create/public/user", userSchema.postPublicUser, usersController.postPublicUser );

module.exports = router;
