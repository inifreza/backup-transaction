'use strict'
const moment = require("moment");
const message = require('../models').messageService;
const roomParticipant = require('../models').roomParticipantService;
const Response = require('../../helpers/response');
const utility = require('../../helpers/utility');
const Room = require('../models').roomService;
const response = new Response();
const crawl = require('../models').crawlService;


class Message {
  static async getMessageList(req, res){
    try {
        const {room_id, page, item,  user_id, auth_code} = req.body;
        const middleware = {
          user_id     : `required|text|${user_id}`,
          auth_code   : `required|text|${auth_code}`,
          room_id     : `required|text|${room_id}`,
          page        : `required|number|${page}`,
          item        : `required|text|${item}`,
        }
        if (utility.validateRequest(middleware)) {
            const bodyParam = {
              room_id : room_id
            }

            const countData = await message.getCountData(bodyParam);
            if(utility.issetVal(countData)){
              const itemPerRequest = utility.issetVal(item)?  parseInt(item) : 15;
              const total_data =  countData;
              const total_page = Math.ceil(total_data / itemPerRequest);
              const limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;
              const options = {
                  start : limitBefore
                  , limit : itemPerRequest
                  , room_id : room_id
                  , user_id : user_id
                  , now  :  moment(Date.now()).format('YYYY-MM-DD HH:mm:ss') 
              }

              const getData = await message.getList(options);
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
          response.setError(400, "Invalid input format", middleware);
          return response.send(res);
        }
    } catch (error) {
      response.setError(500, error.message);
      return response.send(res);
    }
  }

  static async getMesage(req,res){
    try {
      const {limit,room_id} = req.body
      const Message = await message.getMessage(room_id, limit)
      if (!Message) {
        response.setError(404, `Cannot find message with the room_id : ${room_id}`);
      } else {
        response.setSuccess(200, "Message Found :", Message);
      }
      return response.send(res);
    } catch (error) {
      response.setError(400, error.message)
    }
  }
  
  static async getAll(req, res){
    try {
        const {room_id, page, item,  user_id, auth_code} = req.body;
        const middleware = {
          user_id     : `required|text|${user_id}`,
          auth_code   : `required|text|${auth_code}`,
          room_id     : `required|text|${room_id}`,
          page        : `required|number|${page}`,
          item        : `required|text|${item}`,
        }
        if (utility.validateRequest(middleware)) {
            const bodyParam = {
              room_id : room_id
            }

            const countData = await message.getCountData(bodyParam);
            if(utility.issetVal(countData)){
              const itemPerRequest = utility.issetVal(item)?  parseInt(item) : 1000;
              const total_data =  countData;
              const total_page = Math.ceil(total_data / itemPerRequest);
              const limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;
              const options = {
                  start : limitBefore
                  , limit : itemPerRequest
                  , room_id : room_id
              }

              const getData = await message.getData(options);
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
      response.setError(500, error.message);
      return response.send(res);
    }
  }

  static async getHistory(req, res){
    try {
        const {room_id, page, item,  user_id} = req.body;
        const middleware = {
          user_id     : `required|text|${user_id}`,
          room_id     : `required|text|${room_id}`,
          page        : `required|number|${page}`,
          item        : `required|text|${item}`,
        }
        if (utility.validateRequest(middleware)) {
            const bodyParam = {
              room_id : room_id
            }

            const countData = await message.getCountData(bodyParam);
            if(utility.issetVal(countData)){
              const itemPerRequest = utility.issetVal(item)?  parseInt(item) : 1000;
              const total_data =  countData;
              const total_page = Math.ceil(total_data / itemPerRequest);
              const limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;
              const options = {
                  start : limitBefore
                  , limit : itemPerRequest
                  , user_id : user_id
                  , room_id : room_id
              }

              const getData = await message.getMessage(options);
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
      response.setError(500, error.message);
      return response.send(res);
    }
  }

  static async deleteMessage(req, res){
    const _id = req.body
    const data = {
      $set :{
        delete : 1
      }
    }

    try {
      const deleteMessage = await message.delete(_id, data);
        if (!deleteMessage) {
          response.setError(404, `Cannot find message with the id: ${_id}`);
        } else {
          response.setSuccess(204, "Message delete", deleteMessage);
        }
        return response.send(res);

    } catch (error) {
      response.setError(404, error.message);
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
          const auth =  await crawl.adminAuth({
            user_id : user_id
            , auth_code : auth_code
          })
          console.log('auth', auth)
          if(!utility.issetVal(auth)){
            response.setError(403, "Unauthorized");
          } else {
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

  static async addRoom(req, res){
    try {
        const {participant_id, user_id, auth_code} = req.body;
        const middleware = {
          participant_id  : `required|text|${participant_id}`
        }
        if (utility.validateRequest(middleware)) { 
          const auth =  await crawl.adminAuth({
            user_id : user_id
            , auth_code : auth_code
          })
          console.log('auth', auth)
          if(!utility.issetVal(auth)){
            response.setError(403, "Unauthorized");
          } else {
            const bodyCheck = {
              user_id : null
              , participant_id : participant_id
              , typeRoom : 'admin_chat'
            }
  
            const _checkRoom = await Room.checkRoom(bodyCheck);  
            // console.log(_checkRoom)
            // return false
            if(!utility.issetVal(_checkRoom)){
              const bodyRoom = {
                title : null
                , type : 'admin_chat'
                , creator_id : ''
                , creator_type : 'admin'
                , create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')  
              }
  
              const _addRoom = await Room.addData(bodyRoom);
              if(utility.issetVal(_addRoom)) {
                const bodyParticipant  = [{
                  room_id : _addRoom.id
                  , user_id : participant_id
                  , type : 'member'
                  , account : 'user'
                  , typeRoom : 'admin_chat'
                }, {
                  room_id : _addRoom.id
                  , user_id : ''
                  , type : 'creator'
                  , account : 'admin'
                  , typeRoom : 'admin_chat'
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
              title       : name
              , type        : 'group'
              , creator_id  : user_id
              , creator_type: 'user'
              , img         : img
              , create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')  
            }
            const _addRoom = await Room.addData(bodyRoom);
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
                response.setSuccess(200, "Create Group Success", {room_id : _addRoom.id});
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

  static async broadcastUser(req, res){
    try {
        const {participant_list, content, user_id, auth_code} = req.body;
        const middleware = {
          participant_list  : `required|text|${participant_list}`
          , content  : `required|text|${content}`
        }
        if (utility.validateRequest(middleware)) { 
          const auth =  await crawl.adminAuth({
            user_id : user_id
            , auth_code : auth_code
          })
          console.log('auth', auth)
          if(!utility.issetVal(auth)){
            response.setError(403, "Unauthorized");
          } else {
            
            let _participant_list = JSON.parse(participant_list).map(async user =>{
              const bodyCheck = {
                user_id : null
                , participant_id : user.user_id
                , typeRoom : 'admin_chat'
              }
    
              const _checkRoom = await Room.checkRoom(bodyCheck);  
              // console.log(_checkRoom)
              // return false
              const bodyRoom = {
                title : null
                , type : 'admin_chat'
                , creator_id : ''
                , img : null
                , creator_type : 'admin'
                , create_date : moment(Date.now()).format('YYYY-MM-DD HH:mm:ss')  
              }
              let ids = null;
              if(!utility.issetVal(_checkRoom)){
                const _addRoom = await Room.addData(bodyRoom);
                if(utility.issetVal(_addRoom)) {
                  ids = _addRoom.id;
                  const bodyParticipant  = [{
                    room_id : _addRoom.id
                    , user_id : user.user_id
                    , type : 'member'
                    , account : 'user'
                    , typeRoom : 'admin_chat'
                  }, {
                    room_id : _addRoom.id
                    , user_id : ''
                    , type : 'creator'
                    , account : 'admin'
                    , typeRoom : 'admin_chat'
                  }]
                  const _addParticipant = await roomParticipant.addData(bodyParticipant);
                  // console.log('_addParticipant', _addParticipant)
                  if(utility.issetVal(_addParticipant)){
                  }
                }
                console.log('baru')
              } else {
                console.log('exist', _checkRoom._id);
                ids = _checkRoom._id;
              }
              
              const dataMessage = {
                room_id : ids
                , user_id : user_id
                , message : content
              }
              console.log(dataMessage);

              await message.addData(dataMessage);
            })
            response.setSuccess(200, "Sending Data!!!");
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
  
}

module.exports = Message;