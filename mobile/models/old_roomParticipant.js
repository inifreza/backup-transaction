//Schema
const roomParticipant = require('../../data/schema').roomParticipantSchema
const Response = require('../../helpers/response')
const response = new Response
const axios = require('axios');

// const User = require('../models/user')
// const LineService = require('../models/lineService')

//Utility
const Utility = require('../../helpers/utility')
// const response = require('../../helpers/response')

module.exports = class RoomParticipants {
  static add (req){
    return new Promise ((resolve, reject) =>{
      roomParticipant
      .insertMany(req)
      .then(data=>{
        resolve(data)
      })
      .catch(error=>{
        reject(error)
      })
    })
  }

  static findAll (){
    return new Promise ((resolve, reject)=>{
      roomParticipant
      .find({})
      .then(data=>{
        let newData = JSON.stringify(data)
        // resolve(data)
        axios.get('http://localhost:8043/api-mobile/v1/room/user_information', {
          data: {
            datas: newData
          }
        })
        .then(({data})=>{
          const {result} = data
          resolve(result)
        })
        .catch(error=>{
          console.log(error);
        })
      })
      .catch(error=>{
        reject(error)
      })
    })
  }

  static findOneAndDelete (req){
    return new Promise((resolve, reject)=>{
      roomParticipant
      .find(req)
      .remove()
      .then(data=>{
        resolve(data)
      })
      .catch(error=>{
        console.log({error : error});
        reject(error)
      })
    })
  }

  static findOne (user_id){
    console.log({user_id : user_id});
    return new Promise((resolve, reject)=>{
      Model
      .findOne(user_id)
      .then(data=>{
        if(Utility.issetVal(data)){
          resolve(data)
        } else {
          reject(null)
        }
      })
      .catch((error)=>{
        console.log({error : error});
        reject(error)
      })
    })
  }

  static getCount (req){
    this.req = req || {}
    return new Promise((resolve, reject)=>{
      Model
      .countDocuments(req)
      .then(resCount=>{
        resolve(resCount)
      })
      .catch(error=>{
        reject(new response(false, 400, 'Fetch Failed'))
      })
    })
  }
}