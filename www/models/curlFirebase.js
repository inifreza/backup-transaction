//Schema
const axios = require('axios');
const _ = require('lodash');

//Utility
const {
    issetVal
} = require('../../helpers/utility')

// global config
const globals = require('../../configs/global')
const env = process.env.NODE_ENV || "development";
let {
    url_crawlOneplus
} = globals[env];

class curlFirebase {
    static async requestFCM(req){
        try {
            const getDevice = new Promise((resolve, reject)=>{
                device.getSpesificUser([getPost.user_id], function(errRes, tokens){
                    utility.issetVal(tokens) ? resolve(tokens) : resolve(tokens);
                })
            })
            

            Promise.all([getDevice])
            .then(arr=>{
               // console.log(arr[0])
             let requests = "";
             if(utility.issetVal(arr[0])){
                 if(utility.issetVal(arr[0]['android'])){
                     requests = utility.requestFCM("android"
                             , firebase.base_url
                             , firebase.server_key
                             , arr[0]['android']
                             , content);
                     
                 }
                 if(utility.issetVal(arr[0]['ios'])){
                     requests = utility.requestFCM("ios"
                             , firebase.base_url
                             , firebase.server_key
                             , arr[0]['ios']
                             , content);
                 }
             }

            
            })
        } catch (error) {
            throw error; 
        }
    }
}
  
module.exports = curlFirebase;