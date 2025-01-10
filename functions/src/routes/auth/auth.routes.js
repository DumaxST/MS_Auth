// Express
const { Router } = require("express");
const router = Router();

//Controller
const authController = require("./authController");

//middleware
const authSchema = require("./authSchema");


router.get("/", (req, res) => {
  res.send(req.t("success_login"));
});

//Endpoint login user
//comentar schema en caso de pruebas sin front
router.post("/login", authSchema.postLogin, authController.authLogin)

module.exports = router;
