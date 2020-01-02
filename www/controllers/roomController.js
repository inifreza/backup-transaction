'use strict'
const moment = require("moment");
const message = require('../models').messageService;
const roomParticipant = require('../models').roomParticipantService;
const Response = require('../../helpers/response');
const utility = require('../../helpers/utility');
const Room = require('../models').roomService;
const response = new Response();
const crawl = require('../models').crawlService;


class roomController {
  

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

  static async getAdminList(req, res){
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
          const auth =  await crawl.adminAuth({
            user_id : user_id
            , auth_code : auth_code
          })
          console.log('auth', auth)
          if(utility.issetVal(auth)){
            const bodyParam = {
              user_id : user_id
              , typeChat : 'admin_chat'
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
                  , typeChat : 'admin_chat'
              }
              utility.issetVal(search)? options.search = search : null;

              const getData = await Room.getList(options);
              // console.log(getData)
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

  static async getGroupList(req, res){
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
          const auth =  await crawl.adminAuth({
            user_id : user_id
            , auth_code : auth_code
          })
          console.log('auth', auth)
          if(utility.issetVal(auth)){
            const bodyParam = {
              user_id : user_id
              , typeChat : 'group'
            }
            utility.issetVal(search)? bodyParam.search = search : null;
            console.log(bodyParam)
            const countData = await Room.getHistoryCountData(bodyParam);
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
                  , typeChat : 'group'
              }
              utility.issetVal(search)? options.search = search : null;

              const getData = await Room.getHistoryList(options);
              // console.log(getData)
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

  static async getInterestList(req, res){
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
          const auth =  await crawl.adminAuth({
            user_id : user_id
            , auth_code : auth_code
          })
          console.log('auth', auth)
          if(utility.issetVal(auth)){
            const bodyParam = {
              user_id : user_id
              , typeChat : 'interest'
            }
            utility.issetVal(search)? bodyParam.search = search : null;
            console.log(bodyParam)
            const countData = await Room.getHistoryCountData(bodyParam);
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
                  , typeChat : 'interest'
              }
              utility.issetVal(search)? options.search = search : null;

              const getData = await Room.getHistoryList(options);
              // console.log(getData)
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


  static async getUserList(req, res){
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
          const auth =  await crawl.adminAuth({
            user_id : user_id
            , auth_code : auth_code
          })
          console.log('auth', auth)
          if(utility.issetVal(auth)){
            const bodyParam = {
              user_id : user_id
              , typeChat : 'chat'
            }
            utility.issetVal(search)? bodyParam.search = search : null;
            console.log(bodyParam)
            const countData = await Room.getHistoryCountData(bodyParam);
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
                  , typeChat : 'chat'
              }
              utility.issetVal(search)? options.search = search : null;

              const getData = await Room.getHistoryList(options);
              // console.log(getData)
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
}

module.exports = roomController;