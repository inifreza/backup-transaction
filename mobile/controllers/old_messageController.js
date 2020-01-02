const Response = require('../../helpers/response')
const response = new Response()
const utility = require('../../helpers/utility')

//model
const Room = require('../models/rooms')
const RoomParticipants = require('../models/roomParticipants')

// image
const formidable = require('formidable')
const path = require('path');
let appDir = path.dirname(require.main.filename);
let pathDir = appDir + '/uploads/groups/'

class messageController {
  static async addRoom (req, res){
    // console.log(req.body);
    // console.log(req.headers);
    console.log({req : req.token});
    console.log({token : req.token});
    try {
      const middleware = {
        user_id        : 'required|text|'+req.body.user_id,
        auth_code      : 'required|text|'+req.body.auth_code,
        participant_id : 'required|text|'+req.body.participant_id,
      }
      if(utility.validateRequest(middleware)){
        if(req.body.auth_code == req.token.auth_code){
          let bodyAdd = {
            title : null,
            type : "chat",
            creator_id : req.body.user_id,
            creator_type : 'user',
          }
          Room
          .add(bodyAdd)
          .then(resAdd=>{
            console.log({resAdd : resAdd});
            let bodyAdd2 =
              [{
                room_id : resAdd._id,
                user_id : req.body.participant_id,
                type    : 'member'
              },
              {
                room_id : resAdd._id,
                user_id : req.body.user_id,
                type    : 'creator'
              }]
              return RoomParticipants.add(bodyAdd2)
          })
          .then(resAdd=>{
            response.setSuccess(200, 'Insert Success')
            response.send(res)
          })
          .catch(error =>{
            response.setError(401,'Insert Failed')
            response.send(res)
          })
        } else {
          response.setError(401,'Unauthozation')
          response.send(res)
        }
      }
    } catch (error){
      console.log(error);
      response.setError(500,error)
      response.send(res)
    }
  }

  static async addGroup(req, res) {
    try { 
      let formData = new Array();
      new formidable.IncomingForm().parse(req)
      .on('field', (name, field) => {
        if(utility.isJson(field)){
          formData.push('"' +name+ '"'+ ':'+field);
        } else {
          formData.push('"' +name+ '"'+ ':'+'"'+utility.escapeHtml(field)+'"')
        }
      })
      .on('file', (name, file) => {
        formData.push('"' +name+ '"'+ ':'+'"'+file.name+'"')
      })
      .on('fileBegin', function (name, file){
        if(utility.checkImageExtension(file.name)){
          let fileType = file.type.split('/').pop();
          file.name = utility.generateHash(16)+ '.' + fileType;
          file.path = appDir + '/uploads/groups/' + file.name;
        }
      })
      .on('aborted', () => {
        console.error('Request aborted by the user')
      })
      .on('error', (err) => {
        console.error('Error', err)
        throw err
      })
      .on('end', () => {
        let temp = '{'+formData.toString() +'}'
        let formJSON = JSON.parse(temp)
        const middleware = {
          user_id         : 'required|text|'+formJSON.user_id,
          auth_code       : 'required|text|'+formJSON.auth_code,
          name            : 'required|text|'+formJSON.name,
          participant_list: 'required|text|'+formJSON.participant_list,
          img             : 'no|text'+formJSON.img
        }

        if(utility.validateRequest(middleware)){
          if(utility.issetVal(req.token)){
            if(req.token.auth_code == formJSON.auth_code){
              let bodyAdd = {
                title       : formJSON.name,
                type        : 'group',
                creator_id  : formJSON.user_id,
                creator_type: 'user',
                img         : formJSON.img
              }

              Room
              .add(bodyAdd)
              .then(resAdd=>{
                let newParticipants = {
                  room_id : resAdd.id,
                  type    : 'creator',
                  user_id : formJSON.user_id,
                }
                let participant_list = formJSON.participant_list.map(user =>{
                    user.room_id = resAdd.id,
                    user.type    = 'member'
                  return user
                })
                participant_list.push(newParticipants)
                return RoomParticipants.add(participant_list)
              })
              .then(resAdd=>{
                response.setSuccess(200, "Insert Success");
                response.send(res)
              })
              .catch(error=>{
                response.setError(401,'Insert Failed')
                response.send(res)
              })
            } else {
              response.setError(403,'Unauthozation2 disini')
              response.send(res)
            }
          } else {
            response.setError(403,'Unauthozation1')
            response.send(res)
          }
        } else {
          response.setError(400, 'Invalid input format')
          response.send(res)
        }

      })
    } catch (error) {
      response.setError(500,error)
      response.send(res)
    }
  }

  static async deleteGroup(req,res){
    try {
      const { user_id, auth_code, room_id} = req.body
      const middleware = {
      user_id         : 'required|text|'+user_id,
      auth_code       : 'required|text|'+auth_code,
      room_id         : 'required|text|'+room_id,
      }
      if(utility.issetVal(middleware)){
        if(auth_code == req.token.auth_code){
          Room
          .findById(room_id)
          .then(resFind=>{
            if(utility.issetVal(resFind)){
              let deleteRoom = Room.findOneAndDelete({_id : room_id})
              let deleteRoomParticipant = RoomParticipants.findOneAndDelete({room_id : room_id})
              return Promise.all([deleteRoom, deleteRoomParticipant])
            } else {
              throw ('Data Not Exist')
            }
          })
          .then(datas=>{
            console.log({datas: datas});
            response.setSuccess(200,'Delete Success')
            response.send(res)
          })
          .catch(error =>{
            response.setError(404,error)
            response.send(res)
          })
        } else {
          response.setError(403,'Unauthozation1')
          response.send(res)
        }
      } else {
        response.setError(400, 'Invalid input format')
        response.send(res)
      }
    } catch(error){
      response.setError(500,error)
      response.send(res)
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
      if(utility.issetVal(middleware)){
        if(auth_code == req.token.auth_code){
          Room
            .findById(room_id)
            .then(resFind=>{
              console.log({resFind : resFind});
              if(utility.issetVal(resFind)){
                return RoomParticipants.findOne({user_id : user_id})
              } else {
                response.setError(404, 'Group Not Exist')
                response.send(res)
              }
            })
            .then(data=>{
              console.log({data: data});
              const {type} = data
              if(type != 'creator'){
                return RoomParticipants.findOneAndDelete({user_id : user_id})
              } else {
                response.setError(402,'You are is Admin')
                response.send(res)
              }
            })
            .then(delUser=>{
              response.setSuccess(200, 'Leave Success')
              response.send(res)
            })
            .catch(error =>{
              response.setError(401, 'Leave Failed')
              response.send(res)
            })
        } else {
          response.setError(403,'Unauthozation1')
          response.send(res)
        }
      } else {
        response.setError(400, 'Invalid input format')
        response.send(res)
      }
    } catch(error){
      response.setError(500,error)
      response.send(res)
    }
    
  }

  static async groupInformation(req, res){
    console.log('Groups Infromation');
    try {
      const { user_id, auth_code, room_id} = req.body
      const middleware = {
        user_id         : 'required|text|'+user_id,
        auth_code       : 'required|text|'+auth_code,
        room_id         : 'required|text|'+room_id,
      }
      if(utility.issetVal(middleware)){
        if(auth_code == req.token.auth_code){
          let data = {
            room_id : null,
            name    : null,
            img     : null, 
            member  : []
          }
          Room
          .findById(room_id)
          .then(resFind=>{
            if(utility.issetVal(resFind)){
              console.log({resFind : resFind});
              const {img, title, _id} = resFind
              data.room_id = _id
              data.name = title
              data.img = img
              return RoomParticipants.findAll({_id : room_id})
            }else {
              response.setError(404,'Group Not Exist')
              response.send(res)
            }
          })
          .then(resFindAll=>{
            data.member= resFindAll
            // console.log({data});
            // console.log({resFindAll : resFindAll});
            res
            response.setSuccess(200,'Fetch Success', data)
            response.send(res)
          })
          .catch(error =>{
            response.setError(401, 'Fetch Failed')
            response.send(res)
          })
        } else {
          response.setError(400, 'Invalid input format')
          response.send(res)
        }
      } else {
        response.setError(400, 'Invalid input format')
        response.send(res)
      }
    } catch (error){
      response.setError(500,error)
      response.send(res)
    }
  }

}

module.exports = messageController