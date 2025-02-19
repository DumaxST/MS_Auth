// Express
const { Router } = require("express");
const router = Router();

// Middlewares
const { validateToken } = require("../../middlewares/auth");
const usersController = require("./usersController");
const userSchema = require("./userSchema");

// ---------------------------------------- RUTAS ---------------------------------------- 

router.post("/user", validateToken, userSchema.postUser, usersController.postUser);

router.put("/user", validateToken, userSchema.putUser, usersController.putUser);

router.get("/user", validateToken, userSchema.getUser, usersController.getUser);

router.delete("/user", validateToken, userSchema.deleteUser, usersController.deleteUser);


//public user
router.post("/public/user", userSchema.postPublicUser, usersController.postPublicUser );

module.exports = router;
