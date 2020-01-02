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

    static async adminAuth(req){
        try {
            const url = `${url_crawlOneplus}api/v1/admin/crawAuth?user_id=${req.user_id}&auth_code=${req.auth_code}`;
            const {
                data
            } = await axios.get(url)

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

    static async getDevice(req){
        try {
            let userArray = []; 
            userArray = JSON.parse(req).map(el => {
                const datas = {
                    user_id : el.user_id
                }
                return datas;
            })

            const url = `${url_crawlOneplus}api/v1/device/getSpesificUser`;
            const {
                data
            } = await axios.post(url, {
                user_list: JSON.stringify(userArray)
            })

            console.log('data', data)

            let response = [];
            if(data.code === 200){
                response = data.result
            }
            return response;
        } catch (error) {
            // console.log(error)
            throw error; 
        }
    }

    static async getDeviceMobile(req){
        try {
            console.log('re', req);
            const url = `${url_crawlOneplus}api/v1/device/getSpesificUser`;
            const {
                data
            } = await axios.post(url, {
                user_list: JSON.stringify(req)
            })

            console.log('data', data)

            let response = [];
            if(data.code === 200){
                response = data.result
            }
            return response;
        } catch (error) {
            // console.log(error)
            throw error; 
        }
    }
}
  
module.exports = crawl;