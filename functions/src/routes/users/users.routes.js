const { Router } = require("express");
const { createDocument } = require("../../../generalFunctions");
const usersController = require("./usersController");
const userSchema = require("./userSchema");
const router = Router();

router.get("/", (req, res) => {
  res.send("Hello, users!");
});

//Endpoint postUser
router.post("/create/user", userSchema.postUser, usersController.postUser);

router.put("/update/user", usersController.putUser); // Falta Schemas

router.get("/get/user", usersController.getUser); // Falta Schemas

router.delete("/delete/user", usersController.deleteUser); // Falta Schemas

module.exports = router;
