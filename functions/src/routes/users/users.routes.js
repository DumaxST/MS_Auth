const { Router } = require("express");
const router = Router();

router.get("/", (req, res) => {
  res.send("Hello, users!");
});


module.exports = router;