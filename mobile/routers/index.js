import app from "express";
const mobileRoute = app.Router();

// Middleware
// const isAuth = require('../../middlewares/is-auth')

// Import Router
const roomRouter = require("./room");
const sandboxRouter = require("./sandbox");

// mobileRoute.use('/room', isAuth, roomRouter);
mobileRoute.use('/room', roomRouter);
mobileRoute.use('/sandbox', sandboxRouter);

module.exports = mobileRoute;
