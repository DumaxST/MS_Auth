// Express
const { Router } = require("express");
const router = Router();

router.get("/", (req, res) => {
  res.send(req.t("success_login"));
});

module.exports = router;
