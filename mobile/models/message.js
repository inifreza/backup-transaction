
const Message = require('../../data/schema').messageSchema
const user = require('../../data/schema').userSchema
const roomParticipant = require('../../data/schema').roomParticipantSchema

const Mongoose = require("mongoose");
const ObjectId = Mongoose.Types.ObjectId;

//utility
const utility = require('../../helpers/utility');
const globals = require('../../configs/global')
const env = process.env.NODE_ENV || "development";
let {
    url_img
    , url_crawlOneplusImg
} = globals[env];

class messageModel {
  static async getList(req){
    try {
      return await Message.aggregate(
        [
          { 
            "$project" : {
                "_id" : 1, 
                "Messages" : "$$ROOT"
            }
          }, 
          { 
              "$lookup" : {
                  "localField" : "Messages.user_id", 
                  "from" : "Users", 
                  "foreignField" : "user_id", 
                  "as" : "Users"
              }
          }, 
          { 
              "$unwind" : {
                  "path" : "$Users", 
                  "preserveNullAndEmptyArrays" : true
              }
          }, { 
                "$project" : { 
                    "message" : "$Messages.message", 
                    "create_date" : "$Messages.create_date", 
                    "true_date" : "$Messages.true_date", 
                    "delete" : "$Messages.delete", 
                    "room_id" : "$Messages.room_id", 
                     "name" : {
                      $cond: [
                        { 
                            "$ifNull": [ 
                                "$Users", 
                                false 
                            ] 
                        },
                        "$Users.name",
                        null
                      ] 
                    },  
                    "img" : {
                      $cond: [
                        { 
                            "$ifNull": [ 
                                "$Users.img", 
                                false 
                            ] 
                        },
                        { $concat: [ `${url_crawlOneplusImg}user/`, "$Users.img" ] },
                        null
                      ] 
                    },  
                    "user_id" : "$Messages.user_id", 
                    "_id" : 1
                    
                }
          }, { $match : { "delete" : 0, "room_id" :  ObjectId(req.room_id)} },
          { 
              $group: {
              _id: '$_id'
             , "message":  { "$first": "$message" }
             , "user_id":  { "$first": "$user_id" }
             , "delete":  { "$first": "$delete" }
             , "true_date":  { "$first": "$true_date" }
             , "room_id":  { "$first": "$room_id" }
             , "name":  { "$first": "$name" }
             , "img":  { "$first": "$img" }
             , "create_date":  { "$first": "$create_date" }
            }
          },
          { $sort : { create_date : -1} },
          { "$skip": req.start },
          { "$limit": req.limit }
        ]).then(cb =>{
          user.findOneAndUpdate({user_id : req.user_id}, {last_online  : req.now}, (err, result) =>{
            console.log('err', err)
          });
          roomParticipant.findOneAndUpdate({user_id : req.user_id, 'room_id' : req.room_id}, {last_online  : req.now}, (err, result) =>{
            console.log('result', result)
          });
          return cb;
        });
    } catch (error) {
      throw error; 
    }
  }

  static async getCountData(req){
    try {
      return await Message.countDocuments(req).then(cb =>{
        return cb;
      })
    } catch (error) {
      throw error; 
    }
  }


  static async getById(id){
     try {
       await Message.findById(id).then(callback => {
         return callback;
       })
     } catch (error) {
       throw error
      }
  }

  static async delete(_id, data) {
    try {
      await Message.findByIdAndUpdate(_id, data)
      return data;
    } catch (error) {
      throw error;
    }
  }

  

  static async addData(newData){
    try {
      return await Message.create(newData);
    } catch (error) {
      throw error; 
    }
  }

}

module.exports = messageModel;