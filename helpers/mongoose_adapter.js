import mongoose from "mongoose";
const { mongo } = require('../configs/database')
const env = process.env.NODE_ENV || "development";
const database= mongo[env]; 

class mongoConnection {
  static async connect(){
    try {
      
      return mongoose.connect(
        database.host
        , {
          useNewUrlParser: true
          , useFindAndModify: false 
          , useUnifiedTopology: true 
      })
      
      .then(()=> {
        let data = true;
        return data
      })
      .catch(error => {
        // throw error; 
        return false;
      })
    
    } catch (error) {
      return false;
    }
  }
}

module.exports = mongoConnection;