"use strict";

// import module
import _ from "lodash";

//Schema
const roomParticipant = require('../../data/schema').roomParticipantSchema

class roomParticipantModel {
  static async getData(req){
    try {
      console.log(req)
      return await roomParticipant.find(null)
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

  static async find(req){
    try {
      return await roomParticipant.find(req)
                  .select()
                  .then(cb =>{
                    return cb;
                  })
    } catch (error) {
      throw error; 
    }
  }

  static async getCountData(req){
    try {
      return await roomParticipant.countDocuments(req).then(cb =>{
        return cb;
      })
    } catch (error) {
      throw error; 
    }
  }

  static async addData(newData){
    try {
      return await roomParticipant.insertMany(newData)
                    .then(data =>{
                      return data;
                    }).catch(error =>{
                      throw error;
                    });
    } catch (error) {
      throw error; 
    }
  }

  static async findByRoom(req){
    try {
      return await roomParticipant.find(req)
                    .then(data =>{
                      return data;
                    }).catch(error =>{
                      throw error;
                    });
    } catch (error) {
      throw error; 
    }
  }

  static async findOne(req){
    try {
      return await roomParticipant.findOne(req)
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
      return await roomParticipant.findOneAndUpdate({
                                                'room_id' :req.room_id
                                                , 'user_id' : req.user_id
                                              }, req, (err, res)=>{
                                                  if(res) {
                                                    return res;
                                                  }
                                              })
                    
    } catch (error) {
      throw error; 
    }
  }

  static async muteRoom(req){
    try {
      return await roomParticipant.updateMany({}, { mute: false });
                    
    } catch (error) {
      throw error; 
    }
  }
}

module.exports = roomParticipantModel;