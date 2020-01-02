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


  static async addData(newData){
    try {
      return await room.create(newData);
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
                  { 'participant.user_id': ""}
                  , { 'participant.user_id' : req.participant_id }
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

  static async getList(req){
    try {
      console.log(req)
      var reqSearch = new RegExp(`${req.search}`);

      let search = {
      };
      if(req.search){
        search["title"] = { $regex: reqSearch, $options: 'i' } 
        search["type"] = { "$eq": 'admin_chat' };
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
                                "$$c.account", 
                                'admin'
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
                              "$$c.account", 
                              'admin'
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
            "$lookup" : {
                "from" : "Messages", 
                "let":{"ids":"$_id", "last_online":"$me.last_online"},
                "pipeline": [
                  { "$match":
                      { "$expr":
                          { "$and":
                              [  
                                  { "$eq": [ "$room_id", "$$ids"] }
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
                "preserveNullAndEmptyArrays" : false
            }
          }, 
          { 
              "$project" : {
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
                  "title" : "$Users.name", 
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
                  "last_message" : "$Messages", 
                  "user_list" : "$participanted",
                  "pathImg":  "user",
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
              , "last_online":  { "$first": "$last_online" }
              , "pathImg":  { "$first": "$pathImg" }
              , "user_list":  { "$first": "$user_list" }
              , "count_unread":  { "$first": "$count_unread" }
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
      console.log(req)
      var reqSearch = new RegExp(`${req.search}`);

      let search = {
      };
      if(req.search){
        search["title"] = { $regex: reqSearch, $options: 'i' } 
        search["type"] = { "$eq": 'admin_chat' };
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
                                  "$$c.account", 
                                  'admin'
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
                              "$$c.account", 
                              'admin'
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
                  "img" :  "$Users.img", 
                  "title" : "$Users.name", 
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

  static async getHistoryList(req){
    try {
      console.log(req)
      let search = {
        type :  { "$eq": req.typeChat }
      };
      if(req.search){
        search["title"] = { "$eq": req.search };
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
            "$lookup": {
              "from": "RoomParticipants",
              "let":{"ids":"$_id"},
              "pipeline": [
                { "$match": { 
                   "$expr": { "$eq": [ "$room_id", "$$ids"] }
                }},
                { "$sort": { "_id": 1 } },
                { "$limit": 1 }
              ],
              "as" : "firstParticipant"
            }
          },
          {
            "$lookup": {
              "from": "RoomParticipants",
              "let":{"ids":"$_id"},
              "pipeline": [
                { "$match": { 
                   "$expr": { "$eq": [ "$room_id", "$$ids"] }
                }},
                { "$sort": { "_id": -1 } },
                { "$limit": 1 }
              ],
              "as" : "lastParticipant"
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
              "$lookup" : {
                  "localField" : "firstParticipant.user_id", 
                  "from" : "Users", 
                  "foreignField" : "user_id", 
                  "as" : "UsersfirstParticipant"
              }
          }, 
          { 
            "$lookup" : {
                "localField" : "lastParticipant.user_id", 
                "from" : "Users", 
                "foreignField" : "user_id", 
                "as" : "UserslastParticipant"
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
                "path" : "$UsersfirstParticipant", 
                "preserveNullAndEmptyArrays" : true
            }
          }, 
          { 
            "$unwind" : {
                "path" : "$UserslastParticipant", 
                "preserveNullAndEmptyArrays" : true
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
            "$unwind" : {
                "path" : "$Messages", 
                "preserveNullAndEmptyArrays" : false
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
              "$project" : {
                  "img" : {
                      "$cond" : {
                          "if" : {
                              "$eq" : [
                                  "$Rooms.type", 
                                  "chat"
                              ]
                          }, 
                          "then" : null,
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
                  "img_first" : {
                    $cond: [
                      { 
                          "$ifNull": [ 
                              "$UsersfirstParticipant.img", 
                              false 
                          ] 
                      },
                      { $concat: [ `${url_crawlOneplusImg}user/`, "$UsersfirstParticipant.img" ] },
                      null
                    ] 
                  }, 
                  "img_last" : {
                    $cond: [
                      { 
                          "$ifNull": [ 
                              "$UserslastParticipant.img", 
                              false 
                          ] 
                      },
                      { $concat: [ `${url_crawlOneplusImg}user/`, "$UserslastParticipant.img" ] },
                      null
                    ] 
                  }, 
                  "title" : {
                      "$cond" : {
                          "if" : {
                              "$eq" : [
                                  "$Rooms.type", 
                                  "chat"
                              ]
                          }, 
                          "then" :  { $concat: [ "$UsersfirstParticipant.name", " X " ,"$UserslastParticipant.name" ] },
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
                  "creator_id" : "$Rooms.creator_id", 
                  "creator_type" : "$Rooms.creator_type", 
                  "create_date" : "$Rooms.create_date", 
                  "last_message" : "$lastMessage",
                  "lastUsers" : "$lastUsers",
                  "count_members" : {"$size" : "$listMembers"},
                  "_id" : 1
              }
          },
          { "$match": search },
          { 
              $group: {
              _id: '$_id'
              , "id":  { "$first": "$_id" }
              , "img":  { "$first": "$img" }
              , "img_first":  { "$first": "$img_first" }
              , "img_last":  { "$first": "$img_last" }
              , "publish":  { "$first": "$publish" }
              , "title":  { "$first": "$title" }
              , "type":  { "$first": "$type" }
              , "featured":  { "$first": "$featured" }
              , "creator_id":  { "$first": "$creator_id" }
              , "creator_type":  { "$first": "$creator_type" }
              , "create_date":  { $last: "$last_message.create_date" }
              , "last_content": { $last: "$last_message.message" }
              , "last_user": { $first: "$lastUsers.name" }
              , "count_members":  { "$first": "$count_members" }
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

  static async getHistoryCountData(req){
    try {
      console.log(req)
      let search = {
        type :  { "$eq": req.typeChat }
      };
      if(req.search){
        search["title"] = { "$eq": req.search };
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
}

module.exports = roomModel;