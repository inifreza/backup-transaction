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

class crawl {
    static async getaUser(){
        try {
            const {
                data
            } = await axios.get(`${url_crawlOneplus}api/v1/user/crawAll`)

            let users = [];
            if(data.code === 200){
                users = data.result
            }
            return users;
            // return false;
        } catch (error) {
            throw error; 
        }
    }

    static async userAuth(req){
        try {
            const {
                data
            } = await axios.get(`${url_crawlOneplus}api-mobile/v1/user/crawAuth?user_id=${req.user_id}&auth_code=${req.auth_code}`)

            if(data.code === 200){
                return true;
            } else {
                return false;
            }
            // return false;
        } catch (error) {
            throw error; 
        }
    }


    static async userFindOne(req){
        try {
            const {
                data
            } = await axios.get(`${url_crawlOneplus}api/v1/user/crawOne/${req}`)

            if(data.code === 200){
                return data.result;
            } else {
                return false;
            }
        } catch (error) {
            throw error; 
        }
    }
}
  
module.exports = crawl;