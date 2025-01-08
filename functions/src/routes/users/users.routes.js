const { Router } = require("express");
const { createDocument } = require("../../../generalFunctions");
const router = Router();

router.get("/", (req, res) => {
  res.send("Hello, users!");
});

router.post("/users", async (req, res) => {
  let user = req.body

  await createDocument("users", user);
  res.status(201).send(user);
});


module.exports = router;