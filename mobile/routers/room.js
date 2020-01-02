const message = require("../controllers").messageController;
const room    = require("../controllers").roomController;
const {Router} = require('express');
const router = Router();

/* Old Routing 
router.post("/addRoom",message.addRoom);
router.delete("/group",message.deleteGroup)
 */
// router.post("/leave", message.leaveGroup)

router.post("/addRoom", room.addRoom);
router.post("/addAdmin", room.addAdmin);
router.post("/getMessage", message.getMessageList);
router.post("/getList", room.getList);
router.post("/addGroup", room.addGroup)
router.post("/addInterest", room.addInterest)
router.post("/information",room.groupInformation)
router.post("/leave", room.leaveGroup)
router.put("/changeImg", room.changeImgGroup)
router.put("/", room.updateData)
router.put("/mute", room.muteRoom)



module.exports = router;
