import app from "express";
const wwwRouter = app.Router();

// Import Router
const sandboxRouter = require("./sandbox");
const messageRouter = require("./message");
const roomRouter = require("./room");

wwwRouter.use('/sandbox', sandboxRouter);
wwwRouter.use('/message', messageRouter);
wwwRouter.use('/room', roomRouter);

module.exports = wwwRouter;
