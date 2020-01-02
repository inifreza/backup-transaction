const sandbox = require("../controllers").sandboxController;
const {Router} = require('express');
const router = Router();

router.post("/getDevice", sandbox.getDevice)
module.exports = router;
