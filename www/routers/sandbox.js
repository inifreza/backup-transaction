const sandbox = require("../controllers").sandboxController;
const {Router} = require('express');
const router = Router();

router.get("/ping", sandbox.getAll);

module.exports = router;
