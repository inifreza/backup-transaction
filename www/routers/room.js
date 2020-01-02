const message = require("../controllers").messageController;
const room    = require("../controllers").roomController;
const {Router} = require('express');
const router = Router();

// router.post("/getHistory", room.getHistory)
router.post("/addRoom", room.addRoom);
router.post("/broadcastUser", room.broadcastUser);
router.post("/getAdminList", room.getAdminList);
router.post("/getUserList", room.getUserList);
router.post("/getInterestList", room.getInterestList);
router.post("/getGroupList", room.getGroupList);

module.exports = router;
