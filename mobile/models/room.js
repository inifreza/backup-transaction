"use strict";

// import module
const _ =  require("lodash");
const Mongoose = require('mongoose');
const ObjectId = Mongoose.Types.ObjectId;

//Schema
const room = require('../../data/schema').roomSchema
const roomParticipant = require('../../data/schema').roomParticipantSchema
const message = require('../../data/schema').messageSchema

//utility
const utility = require('../../helpers/utility');
const globals = require('../../configs/global')
const env = process.env.NODE_ENV || "development";
let {
    url_img
    , url_crawlOneplusImg
} = globals[env];

//models
const crawl = require('./crawl');
 

class roomModel {
  static async getData(req){
    try {
      console.log(req)
      return await room.find(null)
                  .select()
                  .skip(req.start)
                  .limit(req.limit)
                  .then(cb =>{
                    return cb;
                  })
    } catch (error) {
      throw error; 
    }
  }

  static async getList(req){
    try {
      console.log(req)
      var reqSearch = new RegExp(`${req.search}`);

      let search = {
      };
      if(req.search){
        search["title"] = { $regex: reqSearch, $options: 'i' } 
      }
      console.log('a',search)
      return await room.aggregate(
        [
          { 
              "$project" : {
                  "_id" : 1, 
                  "Rooms" : "$$ROOT"
              }
          }, 
          { 
              "$lookup" : {
                  "localField" : "Rooms._id", 
                  "from" : "RoomParticipants", 
                  "foreignField" : "room_id", 
                  "as" : "RoomParticipants"
              }
          }, 
          { 
              "$addFields" : {
                  "participanted" : {
                      "$filter" : {
                          "input" : "$RoomParticipants", 
                          "as" : "c", 
                          "cond" : {
                              "$ne" : [
                                  "$$c.user_id", 
                                  req.user_id 
                              ]
                          }
                      }
                  }
              }
          },
          { 
            "$addFields" : {
                "me" : {
                    "$filter" : {
                        "input" : "$RoomParticipants", 
                        "as" : "c", 
                        "cond" : {
                            "$eq" : [
                                "$$c.user_id", 
                                req.user_id 
                            ]
                        }
                    }
                }
            }
          }, 
          { 
              "$lookup" : {
                  "localField" : "participanted.user_id", 
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
          }, 
          
          { 
            "$unwind" : {
                "path" : "$me", 
                "preserveNullAndEmptyArrays" : false
            }
          }, 
          { 
            "$lookup" : {
                "localField" : "Rooms._id", 
                "from" : "Messages", 
                "foreignField" : "room_id", 
                "as" : "Messages"
            }
          },
          {
            "$lookup": {
              "from": "Messages",
              "let":{"ids":"$_id"},
              "pipeline": [
                { "$match": { 
                   "$expr": { "$eq": [ "$room_id", "$$ids"] }
                }},
                { "$sort": { "_id": -1 } },
                { "$limit": 1 }
              ],
              "as" : "lastMessage"
            }
          },
          { 
            "$lookup" : {
                "localField" : "lastMessage.user_id", 
                "from" : "Users", 
                "foreignField" : "user_id", 
                "as" : "lastUsers"
            }
          }, 
          {
            "$lookup": {
              "from": "RoomParticipants",
              "let":{"ids":"$_id"},
              "pipeline": [
                { "$match":
                      { "$expr":
                          { "$and":
                              [  
                                  { "$eq": [ "$room_id", "$$ids"] }
                                  , { "$eq": [ "$deleted", 0 ] }
                              ]
                          }
                      }
                }
              ],
              "as" : "listMembers"
            }
          },
          { 
            "$lookup" : {
                "from" : "Messages", 
                "let":{"ids":"$_id", "last_online":"$me.last_online"},
                "pipeline": [
                  { "$match":
                      { "$expr":
                          { "$and":
                              [  
                                  { "$eq": [ "$room_id", "$$ids"] }
                                  , { "$eq": [ "$delete", 0] }
                                  , { "$ne": [ "$user_id", req.user_id ] }
                                  , { $gte: [ "$create_date", "$$last_online"] }
                              ]
                          }
                      }
                  }
                ],
                "as" : "unread"
            }
          },
          
          { 
            "$unwind" : {
                "path" : "$Messages", 
                "preserveNullAndEmptyArrays" : true
            }
          },
          { 
            "$unwind" : {
                "path" : "$lastUsers", 
                "preserveNullAndEmptyArrays" : true
            }
          },
          { 
            "$unwind" : {
                "path" : "$lastMessage", 
                "preserveNullAndEmptyArrays" : true
            }
          }, 
          { 
            "$addFields" : {
                "titles" : {
                  "$cond" : {
                      "if" : {
                          "$eq" : [
                              "$Rooms.type", 
                              "chat"
                          ]
                      }, 
                      "then" : "$Users.name", 
                      "else" : "$Rooms.title"
                  }
                }
            }
          }, 
          { 
              "$project" : {
                  "img" : {
                      "$cond" : {
                          "if" : {
                              "$eq" : [
                                  "$Rooms.type", 
                                  "chat"
                              ]
                          }, 
                          "then" :  {
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
                          "else" :  {
                            $cond: [
                              { 
                                  "$ifNull": [ 
                                      "$Rooms.img", 
                                      false 
                                  ] 
                              },
                              { $concat: [ `${url_img}groups/`, "$Rooms.img" ] },
                              null
                            ] 
                          }
                      }
                  }, 
                  "title" : "$titles",
                  "featured" : {
                    "$cond" : {
                        "if" : {
                            "$eq" : [
                                "$Rooms.type", 
                                "admin_chat"
                            ]
                        }, 
                        "then" : "1", 
                        "else" : "0"
                    }
                  }, 
                  "publish" : "$Rooms.publish", 
                  "type" : "$Rooms.type", 
                  "me" : "$me.user_id", 
                  "mute" : "$me.mute", 
                  "last_online" : "$me.last_online", 
                  "creator_id" : "$Rooms.creator_id", 
                  "creator_type" : "$Rooms.creator_type", 
                  "create_date" : "$Rooms.create_date", 
                  "last_message" : "$lastMessage",
                  "lastUsers" : "$lastUsers",
                  "user_list" : "$participanted",
                  "count_members" : {"$size" : "$listMembers"},
                  "count_unread" :{"$size" :"$unread" },
                  "_id" : 1
              }
          },
          { "$match": search },
          { 
              $group: {
              _id: '$_id'
              , "id":  { "$first": "$_id" }
              , "img":  { "$first": "$img" }
              , "publish":  { "$first": "$publish" }
              , "title":  { "$first": "$title" }
              , "type":  { "$first": "$type" }
              , "me":  { "$first": "$me" }
              , "mute":  { "$first": "$mute" }
              , "featured":  { "$first": "$featured" }
              , "creator_id":  { "$first": "$creator_id" }
              , "creator_type":  { "$first": "$creator_type" }
              , "create_date":  { $last: "$last_message.create_date" }
              , "last_content": { $last: "$last_message.message" }
              , "last_user": { $first: "$lastUsers.name" }
              , "last_online":  { "$first": "$last_online" }
              , "count_unread":  { "$first": "$count_unread" }
              , "count_members":  { "$first": "$count_members" }
              , "user_list":  { "$first": "$user_list" }
            }
          },
          { $sort : { featured : -1, create_date : -1} },
          { "$skip": req.start },
          { "$limit": req.limit }
          
      ], 
        (err, datas) => {
          return datas;
        }
      )
      .then(datas => {
        return datas;
      });
    } catch (error) {
      throw error; 
    }
  }

  static async getCountData(req){
    try {
      var reqSearch = new RegExp(`${req.search}`);

      let search = {
      };
      if(req.search){
        search["title"] = { $regex: reqSearch, $options: 'i' } 
      }
      return await room.aggregate(
        [
          { 
              "$project" : {
                  "_id" : 1, 
                  "Rooms" : "$$ROOT"
              }
          }, 
          { 
              "$lookup" : {
                  "localField" : "Rooms._id", 
                  "from" : "RoomParticipants", 
                  "foreignField" : "room_id", 
                  "as" : "RoomParticipants"
              }
          }, 
          { 
              "$addFields" : {
                  "participanted" : {
                      "$filter" : {
                          "input" : "$RoomParticipants", 
                          "as" : "c", 
                          "cond" : {
                              "$ne" : [
                                  "$$c.user_id", 
                                  req.user_id 
                              ]
                          }
                      }
                  }
              }
          },
          { 
            "$addFields" : {
                "me" : {
                    "$filter" : {
                        "input" : "$RoomParticipants", 
                        "as" : "c", 
                        "cond" : {
                            "$eq" : [
                                "$$c.user_id", 
                                req.user_id 
                            ]
                        }
                    }
                }
            }
          }, 
          { 
              "$lookup" : {
                  "localField" : "participanted.user_id", 
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
          }, 
          
          { 
            "$unwind" : {
                "path" : "$me", 
                "preserveNullAndEmptyArrays" : false
            }
          }, 
          { 
            "$lookup" : {
                "localField" : "Rooms._id", 
                "from" : "Messages", 
                "foreignField" : "room_id", 
                "as" : "Messages"
            }
          }, 
      
          { 
            "$unwind" : {
                "path" : "$Messages", 
                "preserveNullAndEmptyArrays" : false
            }
          }, 
          { 
              "$project" : {
                  "img" : {
                      "$cond" : {
                          "if" : {
                              "$eq" : [
                                  "$Rooms.type", 
                                  "chat"
                              ]
                          }, 
                          "then" :  {
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
                          "else" :  {
                            $cond: [
                              { 
                                  "$ifNull": [ 
                                      "$Rooms.img", 
                                      false 
                                  ] 
                              },
                              { $concat: [ `${url_img}groups/`, "$Rooms.img" ] },
                              null
                            ] 
                          }
                      }
                  }, 
                  "title" : {
                      "$cond" : {
                          "if" : {
                              "$eq" : [
                                  "$Rooms.type", 
                                  "chat"
                              ]
                          }, 
                          "then" : "$Users.name", 
                          "else" : "$Rooms.title"
                      }
                  }, 
                  "featured" : {
                    "$cond" : {
                        "if" : {
                            "$eq" : [
                                "$Rooms.type", 
                                "admin_chat"
                            ]
                        }, 
                        "then" : "1", 
                        "else" : "0"
                    }
                  }, 
                  "publish" : "$Rooms.publish", 
                  "type" : "$Rooms.type", 
                  "me" : "$me.user_id", 
                  "mute" : "$me.mute", 
                  "creator_id" : "$Rooms.creator_id", 
                  "creator_type" : "$Rooms.creator_type", 
                  "create_date" : "$Rooms.create_date", 
                  "last_message" : "$Messages",
                  "_id" : 1
              }
          },
          { "$match": search },
          { 
              $group: {
              _id: '$_id'
              , "id":  { "$first": "$_id" }
              , "img":  { "$first": "$img" }
              , "publish":  { "$first": "$publish" }
              , "title":  { "$first": "$title" }
              , "type":  { "$first": "$type" }
              , "me":  { "$first": "$me" }
              , "mute":  { "$first": "$mute" }
              , "featured":  { "$first": "$featured" }
              , "creator_id":  { "$first": "$creator_id" }
              , "creator_type":  { "$first": "$creator_type" }
              , "create_date":  { $last: "$last_message.create_date" }
              , "last_content": { $last: "$last_message.message" }
              , "last_user": { $push: "$last_message" }
              , "count_unread": { $last: "10" }
            }
          }
          
      ], 
        (err, datas) => {
          return datas;
        }
      )
      .then(datas => {
        return datas.length;
      });
    } catch (error) {
      throw error; 
    }
  }



  static async addData(newData){
    try {
      return await room.create(newData);
    } catch (error) {
      throw error; 
    }
  }

  static async checkRoomAdmin(req){
    try {
      console.log(req)
      return await room.aggregate(
        [
          { "$lookup": {
            "from": "RoomParticipants",
            "localField": "_id",
            "foreignField": "room_id",
            "as": "participant"
          }},
          { "$unwind": "$participant" },
          {
            "$match":{
              "$and":[
                { "$or": [ 
                  { 'participant.user_id': ""}
                  , { 'participant.user_id' : req.user_id }
                ] },
                {"participant.typeRoom":"admin_chat"}
              ]
           }
          },
          { $group: {
            _id: '$_id',
            rooms: { $push: '$participant' }
          }}
        ],
        (err, datas) => {
          return datas;
        }
      )
      .then(datas => {
        //   console.log(datas)
        let arr = datas.filter(aItem=>{
          return aItem.rooms.length==2;
        });
        return arr[0];
      });
    } catch (error) {
      throw error; 
    }
  }

  static async checkRoom(req){
    try {
      console.log(req)
      return await room.aggregate(
        [
          { "$lookup": {
            "from": "RoomParticipants",
            "localField": "_id",
            "foreignField": "room_id",
            "as": "participant"
          }},
          { "$unwind": "$participant" },
          {
            "$match":{
              "$and":[
                { "$or": [ 
                  { 'participant.user_id': req.user_id }
                  , { 'participant.user_id' : req.participant_id } 
                ] },
                {"participant.typeRoom":"chat"}
              ]
           }
          },
          { $group: {
            _id: '$_id',
            rooms: { $push: '$participant' }
          }}
        ],
        (err, datas) => {
          return datas;
        }
      )
      .then(datas => {
        console.log('dast', datas)
        let arr = datas.filter(aItem=>{
          return aItem.rooms.length==2;
        });
        return arr[0];
      });
    } catch (error) {
      throw error; 
    }
  }

  static async roomInformation(req){
    try {
      console.log(req)
      return await room
      .findById(req.room_id)
      .then(async data=>{
        const {_id, img, publish, title, type, creator_id, creator_type, create_date } = data
        let result = {
          id              : _id
          , img           : img
          , publish       : publish
          , title         : title
          , type          : type
          , creator_id    : creator_id
          , creator_name  : null
          , creator_type  : creator_type
          , create_date   : create_date
          , mute          : false
        }
        console.log(result);
        utility.issetVal(result.img)  ? result.img = `${url_img}groups/${result.img}`  : result.img = null;
        const participant = await roomParticipant.find({room_id : result.id, 'deleted' : 0})
                            .select()
                            .then(cb =>{
                              return Promise.all(cb.map(async el =>{
                                
                                let resParticipant = {
                                  "publish": el.participant
                                  , "deleted": el.deleted
                                  , "_id": el._id
                                  , "room_id": el.room_id
                                  , "user_id": el.user_id
                                  , "type": el.type
                                  , "account": el.account
                                  , "typeRoom": el.typeRoom
                                  , "mute": el.mute
                                  , "name": null
                                  , "batch": null
                                  , "img": null
                                  , "lineservice": null
                                }
                                // console.log('user_id', el.user_id);
                                const userData = await crawl.userFindOne(resParticipant.user_id);
                                if(utility.issetVal(userData)) {
                                  resParticipant.name = userData.name;
                                  resParticipant.batch = userData.batch;
                                  resParticipant.img = userData.img;
                                  resParticipant.lineservice = userData.lineservice_title;
  
                                }
                               
                                el.type === "creator" ? result.creator_name = userData.name : null;
                                if(el.user_id == req.user_id){
                                  console.log('dar')
                                  result.mute = resParticipant.mute;
                                }
                                
                                return resParticipant ;
                              })).then(res =>{
                                return res;
                              });
                            })
                            .then(res =>{
                              return res;
                            })
        if(utility.issetVal(participant)){
          result.participant = participant;
        } 
        return result;
      })
      .then(data=>{
        return data
      })
    } catch (error) {
      throw error; 
    }
  }

  static async findOne(req){
    try {
      return await room.findOne(req)
                    .then(data =>{
                      return data;
                    }).catch(error =>{
                      throw error;
                    });
    } catch (error) {
      throw error; 
    }
  }

  static async updateData(req){
    try {
      return await room.findByIdAndUpdate(req.id, req, (err, res)=>{
                                                  if(res) {
                                                    return res;
                                                  }
                                              })
                    
    } catch (error) {
      throw error; 
    }
  }
}

module.exports = roomModel;