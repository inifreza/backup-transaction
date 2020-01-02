"use strict";

const redis = require("redis").createClient;
const moment = require('moment')
const adapter = require("socket.io-redis");
// const { SOCKET_MSG, SERVER } = require("../configs/global");
const message = require("../www/models/").messageService;
const curlFirebase = require("../www/models/").curlFirebaseService;
const user = require("../www/models/").userService;
const crawl = require("../www/models/").crawlService;

//utility
const utility = require('../helpers/utility');
const globals = require('../configs/global')
const env = process.env.NODE_ENV || "development";
let {
    url_img
    , url_crawlOneplusImg
    , firebase
} = globals[env];

require("dotenv").config;

class IO {

  static async ioEvents(io){
   
    io.set("transports", ["websocket"]);

    // Using Redis
    const port = process.env.REDIS_PORT;
    const host = process.env.REDIS_HOST;
    const password = process.env.REDIS_PASSWORD;
  
    const pubClient = redis(port, host, { auth_pass: password });
    const subClient = redis(port, host, {
      auth_pass: password,
      return_buffers: true
    });
    io.adapter(adapter({ pubClient, subClient }));

    const wwwNs = io.of('/www');
    const mobileNs = io.of('/mobile');

    wwwNs.on("connection", function(socket) {
      socket.on("join", function(data) {
        console.log("Socket Room :" + data.room);
        socket.join(data.room); // We are using room of socket io
      });
  
      socket.on("chat",  async (data) => {
        // Push Database
        message.addData(data);
        
        // Prepare callback pushnotif
        data.true_date = moment(Date.now()).format('HH:mm');
        data.create_date = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');
        data.name = null;
        data.img = null
        const _userData = await user.getUser(data);
        // data.name = _userData.name;
        if(utility.issetVal(_userData)){
          if(utility.issetVal(_userData.img)){
            data.img  = `${url_crawlOneplusImg}user/${_userData.img}`;  
          } else {
            data.img  = null;
          }
        }
        // console.log(data)
        console.log('socket save', data)
        wwwNs.to(data.room_id).emit("chat", data);
        mobileNs.to(data.room_id).emit("chat", data);
        // console.log(a)
        const userList = utility.issetVal(data.user_list)? data.user_list : null;
        const nameRoom = null;
        const imgRoom = null;
        const typeRoom = 'new_single_admin';

        const device  =  await crawl.getDevice(userList);
        // console.log(data.ios);
        // return false;
        const content = {
          headline        : 'New Chat',
          sub_headline    : `PwC Admin : ${data.message}`,
          type            : typeRoom,
          redirect        : true,
          id              : data.room_id,
          nameRoom        : nameRoom,
          imgRoom         : imgRoom,
        }
  
        if(utility.issetVal(device.android)){
             utility.requestFCM("android"
                    , firebase.base_url
                    , firebase.server_key
                    , device.android
                    , content);
            // console.log('android', request)
        }

        if(utility.issetVal(device.ios)){
             utility.requestFCM("ios"
                    , firebase.base_url
                    , firebase.server_key
                    , device.ios
                    , content);
            // console.log('android', request)
        }
        // console.log(a)
      });
  
      // Handle typing event
      socket.on("typing", data => {
        console.log("socket typing", data.room_id);
        wwwNs.to(data.room_id).emit("typing", data);
        mobileNs.to(data.room_id).emit("typing", data);
        
      });
  
      // to check if user seen Message
      socket.on("userSeen", function(msg) {
        socket.broadcast.to(socket.id.room).emit("userSeen", msg);
      });
      // When a socket exits
      socket.on("disconnect", async data => {
      var user = data.user_id;
      if (typeof (user !== undefined)) {
        // socket.leave(user.room); // leave the room
        // //broadcast leave room to only memebers of same room
        // socket.broadcast.to(user.room).emit("message", {
        // text: user.name + " has offline"          
        // });
      }
      });
    });


    
    mobileNs.on("connection", function(socket) {
      socket.on("join", function(data) {
        console.log("Socket Room :" + data.room);
        socket.join(data.room); // We are using room of socket io
      });
  
      socket.on("chat", async (data) => {
        // Push Database
        data.true_date = moment(Date.now()).format('HH:mm');
        const _addData = await message.addData(data);
        data.create_date = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss');

        const _userData = await user.getUser(data);
        data.name = _userData.name;
        if(utility.issetVal(_userData.img)){
          data.img  = `${url_crawlOneplusImg}user/${_userData.img}`;  
        } else {
          data.img  = null;
        }
        
        // console.log(data)
        console.log('socket save', data)
        mobileNs.to(data.room_id).emit("chat", data);
        wwwNs.to(data.room_id).emit("chat", data);

        // start Prepare Pushnotif
        const userList = utility.issetVal(data.user_list)? data.user_list : null;
        let nameRoom = utility.issetVal(data.nameRoom)? data.nameRoom : null;
        let imgRoom = utility.issetVal(data.imgRoom)? data.imgRoom : null;
        if(data.typeRoom=="single"){
           nameRoom = data.name;
           imgRoom  = data.img;
        }
        const typeRoom = utility.issetVal(data.typeRoom)? data.typeRoom : 'new_single_chat';
        
        const device  =  await crawl.getDeviceMobile(userList);
        const type = `new_${typeRoom}_chat`;
        
        const content = {
          headline        : null,
          sub_headline    : null,
          type            : type,
          redirect        : true,
          id              : data.room_id,
          room_id         : data.room_id,
          img             : imgRoom,
          name            : nameRoom
        }
        console.log('user', content);
         
        content.headline = typeRoom == "single" ?  `${_userData.name}` : `New Chat ${nameRoom}` ;
        content.sub_headline = typeRoom == "single" ?  `${data.message}` : `${_userData.name} : ${data.message}`;
        
  
        if(utility.issetVal(device.android)){
             utility.requestFCM("android"
                    , firebase.base_url
                    , firebase.server_key
                    , device.android
                    , content);
        }

        if(utility.issetVal(device.ios)){
             utility.requestFCM("ios"
                    , firebase.base_url
                    , firebase.server_key
                    , device.ios
                    , content);
        }
        // End Prepare Pushnotif
      });
  
      // Handle typing event
      socket.on("typing", data => {
        console.log("socket typing", data.room_id);
        mobileNs.to(data.room_id).emit("typing", data);
        wwwNs.to(data.room_id).emit("typing", data);
      });
  
      // to check if user seen Message
      socket.on("userSeen", function(msg) {
        socket.broadcast.to(socket.id.room).emit("userSeen", msg);
      });
      // When a socket exits
      socket.on("disconnect", async data => {
      var user = data.user_id;
      if (typeof (user !== undefined)) {
        // socket.leave(user.room); // leave the room
        // //broadcast leave room to only memebers of same room
        // socket.broadcast.to(user.room).emit("message", {
        // text: user.name + " has offline"          
        // });
      }
      });
    });
  };  
}
module.exports = IO;
