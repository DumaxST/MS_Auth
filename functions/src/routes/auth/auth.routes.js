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

//security code
router.post("/password/code", authSchema.passwordCode, authController.passwordCode);

//reset password
router.post("/reset/password", authSchema.validateCode, authController.validateVerificationCode); 

module.exports = router;
