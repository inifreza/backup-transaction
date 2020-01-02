const message = require("../controllers").messageController;
const {Router} = require('express');
const router = Router();

router.post("/getHistory", message.getHistory)
router.post("/getData", message.getAll);
router.post("/getAllUsersInRoom", message.getAllUsersInRoom);
router.delete("/delete", message.deleteMessage)
router.post("/getMessage", message.getMessageList);
router.post("/addRoom", message.addRoom);
router.post("/broadcastUser", message.broadcastUser);

module.exports = router;
