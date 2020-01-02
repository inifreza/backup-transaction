//Schema
const room = require('../../data/schema').roomSchema

module.exports = class Room {
  static add (req){
    return new Promise ((resolve, reject) =>{
      new room(req).save()
      .then(data=>{
        resolve(data)
      })
      .catch(error=>{
        reject(error)
      })
    })
  }

  static findById (id){
    return new Promise((resolve, reject)=>{
      room
      .findById(id)
      .then(data=>{
        resolve(data)
      })
      .catch((error)=>{
        reject(error)
      })
    })
  }

  static findOneAndDelete (id){
    return new Promise((resolve, reject)=>{
      room
      .find(id)
      .remove()
      .then(data=>{
        resolve(data)
      })
      .catch(()=>{
        throw (error)
      })
    })
  }

  static findAll (req, page, limit ){
    this.req = req || {}
    this.page = parseInt(page) || null
    this.limit = parseInt(limit) || null
    console.log(this.req, this.page,this.limit);
    return new Promise((resolve, reject)=>{
      room
      .find(this.req)
      .skip(this.page)
      .limit(this.limit)
      .then(data=>{
        console.log({data : data});
        resolve(data)
      })
      .catch(error=>{
        console.log(error);
        reject(error)
      })
    })
  }

  static count (req){
    this.req = req || {}
    return new Promise((resolve, reject)=>{
      room
      .countDocuments(req)
      .then(resCount=>{
        resolve(resCount)
      })
      .catch(error=>{
        reject(error)
      })
    })
  }
}
