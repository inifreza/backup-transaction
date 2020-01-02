'use strict'
const message = require('../models').messageService;
const Response = require('../../helpers/response');
const utility = require('../../helpers/utility');
const response = new Response();

import moment from "moment";

class messageController {
  static async getMessageList(req, res){
    try {
        const {room_id, page, item,  user_id, auth_code} = req.body;
        const middleware = {
          user_id     : `required|text|${user_id}`,
          auth_code   : `required|text|${auth_code}`,
          room_id     : `required|text|${room_id}`,
          page        : `required|number|${page}`,
          item        : `required|text|${item}`,
        }
        if (utility.validateRequest(middleware)) {
            const bodyParam = {
              room_id : room_id
            }

            const countData = await message.getCountData(bodyParam);
            if(utility.issetVal(countData)){
              const itemPerRequest = utility.issetVal(item)?  parseInt(item) : 15;
              const total_data =  countData;
              const total_page = Math.ceil(total_data / itemPerRequest);
              const limitBefore = page <= 1 || page == null ? 0 : (page-1) * itemPerRequest;
              const options = {
                  start : limitBefore
                  , limit : itemPerRequest
                  , room_id : room_id
                  , user_id : user_id
                  , now  :  moment(Date.now()).format('YYYY-MM-DD HH:mm:ss') 
              }

              const getData = await message.getList(options);
              console.log('data', getData)
              if(utility.issetVal(getData)){
                const totalInfo = {
                  total_page : total_page,
                  total_data_all : total_data,
                  total_data : getData.length
                }

                response.setSuccess(200, "Fetch Success", {
                  count_members : 100,
                  data :getData,
                  total: totalInfo
                });
              } else {
                response.setError(401, "Fetch Failed2");
              }
            } else {
              response.setError(401, "Fetch Failed1");
            }
        } else {
          response.setError(400, "Invalid input format", middleware);
        }
        return response.send(res);
    } catch (error) {
      response.setError(500, error.message);
      return response.send(res);
    }
  }
}

module.exports = messageController;
