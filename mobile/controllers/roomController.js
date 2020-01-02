'use strict'
import moment from "moment";

const message = require('../models').messageService;
const Room = require('../models').roomService;
const roomParticipant = require('../models').roomParticipantService;
const crawl = require('../models').crawlService;
const Response = require('../../helpers/response');
const utility = require('../../helpers/utility');
const response = new Response();

// image
const formidable = require('formidable')
const path = require('path');
let appDir =  path.join(__dirname, '../..');
let pathDir = appDir + '/uploads/groups/'

// global config
const globals = require('../../configs/global')
const env = process.env.NODE_ENV || "development";
let {
  url_img
  , url_crawlOneplusImg
  , firebase
} = globals[env];

class roomController {

  static async getList(req, res ){
    try {
        const {page, item,  user_id, auth_code, search} = req.body;
        const middleware = {
          user_id     : `required|text|${user_id}`
          , auth_code   : `required|text|${auth_code}`
          , page        : `required|number|${page}`
          , item        : `required|text|${item}`
          , search      : `no|text|${search}`
        }
        if (utility.validateRequest(middleware)) {
          const auth =  await crawl.userAuth({
            user_id : user_id
            , auth_code : auth_code
          })
          console.log('auth', auth)
          if(utility.issetVal(auth)){
            const bodyParam = {
              user_id : user_id
            }
            utility.issetVal(search)? bodyParam.search = search : null;
            console.log(bodyParam)
            const countData = await Room.getCountData(bodyParam);
            console.log(countData)
            if(utility.issetVal(countData)){
              const itemPerRequest = utility.issetVal(item)?  parseInt(item) : 15;
              const total_data =  countData;
              const total_page = Math.ceil(total_data / itemPerRequest);
              const limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;
              const options = {
                  start : limitBefore
                  , limit : itemPerRequest
                  , user_id : user_id
              }
              utility.issetVal(search)? options.search = search : null;

              const getData = await Room.getList(options);
              console.log(getData)
              if(utility.issetVal(getData)){
                const totalInfo = {
                  total_page : total_page,
                  total_data_all : total_data,
                  total_data : getData.length
                }

                response.setSuccess(200, "Fetch Success", {
                  data :getData,
                  total: totalInfo
                });
                return response.send(res);
              } else {
                response.setError(401, "Fetch Failed2");
                return response.send(res);
              }
            } else {
              response.setError(401, "Fetch Failed1");
              return response.send(res);
            }
          } else {
            response.setError(403, "Unauthorized");
            return response.send(res);
          }
        } else {
          response.setError(400, "Invalid input format", middleware);
          return response.send(res);
        }
    } catch (error) {
      response.setError(500, error.message);
      return response.send(res);
    }
  }

  static async getAllUsersInRoom(req, res){
    try {
        const {page, item, room_id} = req.body
        const middleware = {
          room_id        : `required|text|${room_id}`,
          page        : `required|number|${page}`,
        }
        if (utility.validateRequest(middleware)) {
            const bodyParam = {
              room_id : room_id
            }

            const countData = await roomParticipant.getCountData(bodyParam);
            if(utility.issetVal(countData)){
              const itemPerRequest = utility.issetVal(item)?  parseInt(item) : 15;
              const total_data =  countData;
              const total_page = Math.ceil(total_data / itemPerRequest);
              const limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;
              const options = {
                  start : limitBefore
                  , limit : itemPerRequest
                  , room_id : room_id
              }

              const getData = await roomParticipant.getData(options);
              if(utility.issetVal(getData)){
                const totalInfo = {
                  total_page : total_page,
                  total_data_all : total_data,
                  total_data : getData.length
                }

                response.setSuccess(200, "Fetch Success", {
                  data :getData,
                  total: totalInfo
                });
              } else {
                response.setError(401, "Fetch Failed2");
              }
            } else {
              response.setError(401, "Fetch Failed1");
            }
        } else {
          response.setError(400, "Invalid input format", middleware);
        }
        return response.send(res);
    } catch (error) {
      console.log(error)
      response.setError(500, error.message);
      return response.send(res);
    }
  }

  // By Freza

  static async addRoom(req, res){
    try {
        const {participant_id, user_id, auth_code} = req.body;
        const middleware = {
          participant_id  : `required|text|${participant_id}`
        }

        if (utility.validateRequest(middleware)) {
            const auth =  await crawl.userAuth({
                            user_id : user_id
                            , auth_code : auth_code
                          })
                          console.log('auth', auth)
            if(utility.issetVal(auth)){
              const bodyCheck = {
                user_id : user_id
                , participant_id : participant_id
                , typeRoom : 'chat'
              }

              const _checkRoom = await Room.checkRoom(bodyCheck);  
              // console.log(_checkRoom)
              if(!utility.issetVal(_checkRoom)){
                const bodyRoom = {
                  title : null
                  , type : 'chat'
                  , creator_id : user_id
                  , creator_type : 'user'
                  , create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')  
                }
  
                const _addRoom = await Room.addData(bodyRoom);
                if(utility.issetVal(_addRoom)) {
                    const participantData = await crawl.userFindOne(participant_id);
                    const userData = await crawl.userFindOne(user_id);
                    const bodyParticipant  = [{
                        room_id : _addRoom.id
                        , user_id : participant_id
                        , type : 'member'
                        , account : 'user'
                        , typeRoom : 'chat'
                        , create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')
                        , name : participantData.name
                    }, {
                        room_id : _addRoom.id
                        , user_id : user_id
                        , type : 'creator'
                        , account : 'user'
                        , typeRoom : 'chat'
                        , create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss') 
                        , name : userData.name
                    }]
                    const _addParticipant = await roomParticipant.addData(bodyParticipant);
                    // console.log('_addParticipant', _addParticipant)
                    if(utility.issetVal(_addParticipant)){
                        response.setSuccess(200, "Insert Success", {room_id : _addRoom.id});
                    } else {
                        response.setError(401,  "Insert Failed");
                    }
                } else {
                  response.setError(401, "Insert Failed");
                }
              } else {
                response.setSuccess(200, "Already Exist", {room_id : _checkRoom._id});
              }

            } else {
              response.setError(403, "Unauthorized");
            }
        } else {
          response.setError(400, "Invalid input format", middleware);
        }
        return response.send(res);
    } catch (error) {
      console.log(error)
      response.setError(500, error.message);
      return response.send(res);
    }
  }

  static async addAdmin(req, res){
    try {
        const {participant_id, user_id, auth_code} = req.body;
        const middleware = {
          participant_id  : `no|text|${participant_id}`
        }
        if (utility.validateRequest(middleware)) {
            const auth =  await crawl.userAuth({
                            user_id : user_id
                            , auth_code : auth_code
                          })
                          console.log('auth', auth)
            if(utility.issetVal(auth)){
              const bodyCheck = {
                user_id : user_id
                , participant_id : null
                , typeRoom : 'admin_chat'
              }

              const _checkRoom = await Room.checkRoomAdmin(bodyCheck);  
              // console.log(_checkRoom)
              // return false;
              if(!utility.issetVal(_checkRoom)){
                const bodyRoom = {
                  title : null
                  , type : 'admin_chat'
                  , creator_id : user_id
                  , creator_type : 'user'
                  , create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')  
                }
  
                const _addRoom = await Room.addData(bodyRoom);
                if(utility.issetVal(_addRoom)) {
                  const bodyParticipant  = [{
                    room_id : _addRoom.id
                    , user_id : ''
                    , type : 'member'
                    , account : 'admin'
                    , typeRoom : 'admin_chat'
                    , create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss') 
                  }, {
                    room_id : _addRoom.id
                    , user_id : user_id
                    , type : 'creator'
                    , account : 'user'
                    , typeRoom : 'admin_chat'
                    , create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss') 
                  }]
                  const _addParticipant = await roomParticipant.addData(bodyParticipant);
                  // console.log('_addParticipant', _addParticipant)
                  if(utility.issetVal(_addParticipant)){
                    response.setSuccess(200, "Insert Success", {room_id : _addRoom.id});
                  } else {
                    response.setError(401,  "Insert Failed");
                  }
                } else {
                  response.setError(401, "Insert Failed");
                }
              } else {
                response.setSuccess(200, "Already Exist", {room_id : _checkRoom._id});
              }

            } else {
              response.setError(403, "Unauthorized");
            }
        } else {
          response.setError(400, "Invalid input format", middleware);
        }
        return response.send(res);
    } catch (error) {
      console.log(error)
      response.setError(500, error.message);
      return response.send(res);
    }
  }

  static async addGroup(req, res) {
    try { 
      let formData = new Array();
      new formidable.IncomingForm().parse(req)
      .on('field', async (name, field) => {
        if(utility.isJson(field)){
          formData.push('"' +name+ '"'+ ':'+field);
        } else {
          formData.push('"' +name+ '"'+ ':'+'"'+utility.escapeHtml(field)+'"')
        }
      })
      .on('file', async (name, file) => {
        formData.push('"' +name+ '"'+ ':'+'"'+file.name+'"')
      })
      .on('fileBegin', async (name, file) => {
        if(utility.checkImageExtension(file.name)){
          // console.log(pathDir)
          let fileType = file.type.split('/').pop();
          file.name = utility.generateHash(16)+ '.' + fileType;
          file.path = `${pathDir}${file.name}`;
        }
      })
      .on('aborted', () => {
        console.error('Request aborted by the user')
      })
      .on('error', (err) => {
        console.error('Error', err)
        throw err
      })
      .on('end', async () => {
        let temp = '{'+formData.toString() +'}'
        let formJSON = JSON.parse(temp)
        let formBox = JSON.parse(temp)
      
        const {user_id, auth_code, name, participant_list, img} = formJSON;
        const middleware = {
          user_id         : `required|text|${user_id}`,
          auth_code       : `required|text|${auth_code}`,
          name            : `required|text|${name}`,
          participant_list: `required|text|${participant_list}`,
          img             : `no|img|${img}`
        }
        console.log(middleware);
        if (utility.validateRequest(middleware)) {
          const arrayUser = formBox.participant_list;
          const auth =  await crawl.userAuth({
                          user_id : user_id
                          , auth_code : auth_code
                        })
          // console.log('atuh', auth);
          // return false;
          if(utility.issetVal(auth)){
            let bodyRoom = {
              title       : name
              , type        : 'group'
              , creator_id  : user_id
              , creator_type: 'user'
              , img         : img
              , create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')  
            }
            const _addRoom = await Room.addData(bodyRoom);
            // console.log(_addRoom);
            // return false;
            if(utility.issetVal(_addRoom)) {
              let newParticipants = {
                room_id : _addRoom.id
                , type    : 'creator'
                , user_id : user_id
                , typeRoom : 'group'
                , account : 'user'
                , create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss') 
              }
              let _participant_list = participant_list.map(user =>{
                  user.room_id  = _addRoom.id,
                  user.type     = 'member'
                  user.typeRoom = 'group'
                  user.account  = 'user'
                  user.create_date  = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss') 

                return user
              })
              _participant_list.push(newParticipants)
              const _addParticipant = await roomParticipant.addData(_participant_list)
              if(utility.issetVal(_addParticipant)){
               
                const data =  await crawl.getDevice(arrayUser);
                // return false;
                const content = {
                  headline        : bodyRoom.title,
                  sub_headline    : "You are invited this group",
                  type            : 'invite_grup',
                  redirect        : true,
                  id              : _addRoom.id,
                  nameRoom        : bodyRoom.title,
                }
                if(utility.issetVal(bodyRoom.img)){
                  content.imgRoom = `${url_img}groups/${bodyRoom.img}`;
                } else {
                  content.imgRoom = null;
                }

                console.log(content);
                
                response.setSuccess(200, "Create Group Success", {room_id : _addRoom.id});
                if(utility.issetVal(data.android)){
                    utility.requestFCM("android"
                            , firebase.base_url
                            , firebase.server_key
                            , data.android
                            , content);
                    // console.log('android', request)
                    
                }
                if(utility.issetVal(data.ios)){
                    utility.requestFCM("ios"
                            , firebase.base_url
                            , firebase.server_key
                            , data.ios
                            , content);
                    // console.log('android', request)
                }
              } else {
                response.setError(401,  "Create Group Failed");
              }
            } else {
              response.setError(401, "Create Group Failed");
            }
          } else {
            response.setError(403, "Unauthorized");
          }
        } else {
          response.setError(400, "Invalid input format", middleware);
        }
        return response.send(res);
      })
    } catch (error) {
      console.log(error)
      response.setError(500,error)
      response.send(res)
    }
  }

  static async addInterest(req, res) {
    try { 
      let formData = new Array();
      new formidable.IncomingForm().parse(req)
      .on('field', async (name, field) => {
        if(utility.isJson(field)){
          formData.push('"' +name+ '"'+ ':'+field);
        } else {
          formData.push('"' +name+ '"'+ ':'+'"'+utility.escapeHtml(field)+'"')
        }
      })
      .on('file', async (name, file) => {
        formData.push('"' +name+ '"'+ ':'+'"'+file.name+'"')
      })
      .on('fileBegin', async (name, file) => {
        if(utility.checkImageExtension(file.name)){
          // console.log(pathDir)
          let fileType = file.type.split('/').pop();
          file.name = utility.generateHash(16)+ '.' + fileType;
          file.path = `${pathDir}${file.name}`;
        }
      })
      .on('aborted', () => {
        console.error('Request aborted by the user')
      })
      .on('error', (err) => {
        console.error('Error', err)
        throw err
      })
      .on('end', async () => {
        let temp = '{'+formData.toString() +'}'
        let formJSON = JSON.parse(temp)
      
        const {user_id, auth_code, name, participant_list, img} = formJSON;
        const middleware = {
          user_id         : `required|text|${user_id}`,
          auth_code       : `required|text|${auth_code}`,
          name            : `required|text|${name}`,
          participant_list: `required|text|${participant_list}`,
          img             : `no|img|${img}`
        }
        console.log(middleware);
        if (utility.validateRequest(middleware)) {
          const auth =  await crawl.userAuth({
                          user_id : user_id
                          , auth_code : auth_code
                        })
          if(utility.issetVal(auth)){
            let bodyRoom = {
              title       : 'Eannovate Assurance'
              , type        : 'interest'
              , creator_id  :  user_id
              , creator_type: 'Assurance'
              , img         :  img
              , create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')  
            }
            const _addRoom = await Room.addData(bodyRoom);
            if(utility.issetVal(_addRoom)) {
              let _participant_list = participant_list.map(user =>{
                  user.room_id  = _addRoom.id,
                  user.type     = 'member'
                  user.typeRoom = 'interest'
                  user.account  = 'user'
                  user.create_date  = moment(Date.now()).format('YYYY-MM-DD HH:mm:ss') 
                return user
              })
              const _addParticipant = await roomParticipant.addData(_participant_list)
              if(utility.issetVal(_addParticipant)){
                response.setSuccess(200, "Create Interest Success", {room_id : _addRoom.id});
              } else {
                response.setError(401,  "Create Interest Failed");
              }
            } else {
              response.setError(401, "Create Interest Failed");
            }
          } else {
            response.setError(403, "Unauthorized");
          }
        } else {
          response.setError(400, "Invalid input format", middleware);
        }
        return response.send(res);
      })
    } catch (error) {
      console.log(error)
      response.setError(500,error)
      response.send(res)
    }
  }

  static async groupInformation(req, res){
    try {
        const { user_id, auth_code, room_id} = req.body
        const middleware = {
          user_id         : 'required|text|'+user_id,
          auth_code       : 'required|text|'+auth_code,
          room_id         : 'required|text|'+room_id,
        }
        if (utility.validateRequest(middleware)) {
          const auth =  await crawl.userAuth({
            user_id : user_id
            , auth_code : auth_code
          })
          console.log('auth', auth)
          if(utility.issetVal(auth)){
            const _room = await Room.roomInformation({
                                      room_id : room_id
                                      , user_id : user_id
                                    });
            if(utility.issetVal(_room)) {
              response.setSuccess(200, "Fetch Success", _room);
            } else {
              response.setError(401, "Fetch Failed1");
            }
          } else {
            response.setError(403, "Unauthorized");
          }
        } else {
          response.setError(400, "Invalid input format", middleware);
        }
        return response.send(res);
    } catch (error) {
      response.setError(500, error.message);
      return response.send(res);
    }
  }

  static async leaveGroup(req, res){
    try {
        const { user_id, auth_code, room_id} = req.body
        const middleware = {
          user_id         : 'required|text|'+user_id,
          auth_code       : 'required|text|'+auth_code,
          room_id         : 'required|text|'+room_id,
        }
        if (utility.validateRequest(middleware)) {
          const auth =  await crawl.userAuth({
            user_id : user_id
            , auth_code : auth_code
          })
          if(utility.issetVal(auth)){
            const _room = await Room.findOne({_id : room_id});
            if(utility.issetVal(_room)) {
              const _participant = await roomParticipant.findOne({
                room_id : room_id
                , user_id : user_id});
              if(utility.issetVal(_participant)){
                if(_participant.type == 'creator'){
                  const findOne = {
                    room_id : room_id
                    , type : 'member' }
                  const _participantOne = await roomParticipant.findOne(findOne);
                  if(utility.issetVal(_participantOne)){
                    const bodyAssign = {
                      user_id   : _participantOne.user_id
                      , room_id : _participantOne.room_id
                      , type : 'creator'
                          };
                    await roomParticipant.updateData(bodyAssign);
                    let bodyRoom = {
                      id            : room_id
                      , creator_id  : _participantOne.user_id
                    }
                    await Room.updateData(bodyRoom);
                  }
                }
                const bodyUpdate = {
                  user_id   : _participant.user_id
                  , room_id : _participant.room_id
                  , deleted : 2};
                const _actLeave = await roomParticipant.updateData(bodyUpdate);
                if(utility.issetVal(_actLeave)){
                  response.setSuccess(200, 'Leave Success')
                  response.send(res)
                } else {
                  response.setError(401, 'Leave Failed')
                  response.send(res)
                }
                
              } else {
                response.setError(406, "You dont provide this group");
                response.send(res)
              }
              
            } else {
              response.setError(404, "Room Not Found");
              response.send(res)
            }
          } else {
            response.setError(403, "Unauthorized");
            response.send(res)
          }
        } else {
          response.setError(400, "Invalid input format", middleware);
          response.send(res)
        }
    } catch (error) {
      response.setError(500, error.message);
      return response.send(res);
    }
  }

  static async changeImgGroup(req, res) {
    try { 
      let formData = new Array();
      new formidable.IncomingForm().parse(req)
      .on('field', async (name, field) => {
        if(utility.isJson(field)){
          formData.push('"' +name+ '"'+ ':'+field);
        } else {
          formData.push('"' +name+ '"'+ ':'+'"'+utility.escapeHtml(field)+'"')
        }
      })
      .on('file', async (name, file) => {
        formData.push('"' +name+ '"'+ ':'+'"'+file.name+'"')
      })
      .on('fileBegin', async (name, file) => {
        if(utility.checkImageExtension(file.name)){
          // console.log(pathDir)
          let fileType = file.type.split('/').pop();
          file.name = utility.generateHash(16)+ '.' + fileType;
          file.path = `${pathDir}${file.name}`;
        }
      })
      .on('aborted', () => {
        console.error('Request aborted by the user')
      })
      .on('error', (err) => {
        console.error('Error', err)
        throw err
      })
      .on('end', async () => {
        let temp = '{'+formData.toString() +'}'
        let formJSON = JSON.parse(temp)
      
        const {user_id, auth_code, img, room_id} = formJSON;
        const middleware = {
          user_id         : `required|text|${user_id}`,
          auth_code       : `required|text|${auth_code}`,
          room_id         : `required|text|${room_id}`,
          img             : `required|img|${img}`
        }
        if (utility.validateRequest(middleware)) {
          const auth =  await crawl.userAuth({
                          user_id : user_id
                          , auth_code : auth_code
                        })
          if(utility.issetVal(auth)){
            const _participant = await roomParticipant.findOne({
              room_id : room_id
              , user_id : user_id
              , type : 'creator'});
            if(utility.issetVal(_participant)){
              let bodyRoom = {
                id       : room_id
                , img         : img
              }
              const _updateRoom = await Room.updateData(bodyRoom);
              console.log(_updateRoom)
              if(utility.issetVal(_updateRoom)) {
                response.setSuccess(200, "Change Images Group Success");
              } else {
                response.setError(401, "Change Images Group Failed");
              }
            } else {
              response.setError(406, "You dont provide this group");
            }
          } else {
            response.setError(403, "Unauthorized");
          }
        } else {
          response.setError(400, "Invalid input format", middleware);
        }
        return response.send(res);
      })
    } catch (error) {
      console.log(error)
      response.setError(500,error)
      response.send(res)
    }
  }

  static async updateData(req, res){
    try {
        const {user_id, auth_code, room_id, title} = req.body;
        const middleware = {
          user_id         : `required|text|${user_id}`,
          auth_code       : `required|text|${auth_code}`,
          room_id         : `required|text|${room_id}`,
          title           : `required|text|${title}`
        }
        if (utility.validateRequest(middleware)) {
            const auth =  await crawl.userAuth({
                            user_id : user_id
                            , auth_code : auth_code
                          })
                          console.log('auth', auth)
            if(utility.issetVal(auth)){
              const _room = await Room.findOne({_id : room_id});
              if(utility.issetVal(_room)) {
                const _participant = await roomParticipant.findOne({
                  room_id : room_id
                  , user_id : user_id
                  , type : 'creator'});
                if(utility.issetVal(_participant)){
                  let bodyRoom = {
                    id       : room_id
                    , title  : title
                  }
                  const updated = await Room.updateData(bodyRoom);
                  if(utility.issetVal(updated)) {
                    response.setSuccess(200, "Update Success", {title : title});
                  } else {
                    response.setError(401, "Update Failed");
                  }
                } else {
                  response.setError(406, "You dont provide this group");
                }
              } else {
                response.setError(404, "Room Not Found");
              }
            } else {
              response.setError(403, "Unauthorized");
            }
        } else {
          response.setError(400, "Invalid input format", middleware);
        }
        return response.send(res);
    } catch (error) {
      console.log(error)
      response.setError(500, error.message);
      return response.send(res);
    }
  }

  static async muteRoom(req, res){
    try {
        const {user_id, auth_code, room_id, status} = req.body;
        const middleware = {
          user_id         : `required|text|${user_id}`,
          auth_code       : `required|text|${auth_code}`,
          room_id         : `required|text|${room_id}`,
          status          : `required|text|${status}`,
        }
        if (utility.validateRequest(middleware)) {
            const auth =  await crawl.userAuth({
                            user_id : user_id
                            , auth_code : auth_code
                          })
                          console.log('auth', auth)
            if(utility.issetVal(auth)){
              const _room = await Room.findOne({_id : room_id});
              if(utility.issetVal(_room)) {
                  const bodyUpdate = {
                    user_id   : user_id
                    , room_id : room_id
                    , mute    : status};
                  const _actUpdate = await roomParticipant.updateData(bodyUpdate);
                  console.log(_actUpdate);
                  
                  if(utility.issetVal(_actUpdate)) {
                    response.setSuccess(200, "Change Mute Success");
                    return response.send(res);
                  } else {
                    response.setError(401, "Change Mute Failed");
                    return response.send(res);
                  }
              } else {
                response.setError(404, "Room Not Found");
                return response.send(res);
              }
            } else {
              response.setError(403, "Unauthorized");
              return response.send(res);
            }
        } else {
          response.setError(400, "Invalid input format", middleware);
        }
    } catch (error) {
      console.log(error)
      response.setError(500, error.message);
      return response.send(res);
    }
  }

}

module.exports = roomController;
