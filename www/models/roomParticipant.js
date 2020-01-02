//crawling data pwcOneplus
const crawl = require('./crawl')

//Schema
const roomParticipant = require('../../data/schema').roomParticipantSchema
const Response = require('../../helpers/response')
const response = new Response
const axios = require('axios');
const _ = require('lodash');

//Utility
const {
    issetVal
} = require('../../helpers/utility')

class RoomParticipants {
    static async getData(req){
        try {
            const users = await crawl.getaUser();

            return await roomParticipant.find({room_id : req.room_id})
                        .select()
                        .skip(req.start)
                        .limit(req.limit)
                        .then(cb =>{
                            return _.map(cb, function(element) { 
                                
                                let el = {
                                    id : element._id
                                    , user_id : element.user_id
                                    , room_id : element.room_id
                                    , type : element.type
                                    , mute : element.mute
                                    , publish : element.publish
                                    , account : element.account
                                    , create_date : element.createdAt
                                }
                                el.name = null;
                                el.img = null;
                                if(el.account == "user"){
                                    let result = _.find(users, { id: el.user_id });
                                    if(issetVal(result)){
                                        el.name = result.name;
                                        el.img = result.img;
                                    }
                                } else if(el.account == "admin"){
                                    el.name = "PWC Admin";
                                }
                                return el
                           });

                        })
                        .then(cb =>{
                            return cb;
                        })
        } catch (error) {
            throw error; 
        }
    }

    static async getParticipant(req){
        try {
            const users = await crawl.getaUser();

            return await roomParticipant.find({room_id : req.room_id})
                        .select()
                        .then(cb =>{
                            return _.map(cb, function(element) { 
                                
                                let el = {
                                    user_id : element.user_id
                                }
                                return el
                           });

                        })
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
            return await roomParticipant.create(newData);
        } catch (error) {
            throw error; 
        }
    }
}
  
module.exports = RoomParticipants;