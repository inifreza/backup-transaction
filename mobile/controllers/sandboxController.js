const Response = require('../../helpers/response')
const response = new Response()
const utility = require('../../helpers/utility')

const crawl = require('../models').crawlService;

// global config
const globals = require('../../configs/global')
const env = process.env.NODE_ENV || "development";
let {
  firebase
} = globals[env];


class sandboxController {
  static async getDevice(req, res) {
    try {
      const data =  await crawl.getDevice(req.body.user_list);
      // console.log(data.ios);
      // return false;
      const content = {
        headline        : 'TEST PUSH NOTIF 9009',
        sub_headline    : 'PING!',
        type            : 'sandbox',
        redirect        : true,
        id              : 'huweihwe'
      }

      if(utility.issetVal(data.android)){
           utility.requestFCM("android"
                  , firebase.base_url
                  , firebase.server_key
                  , data.android
                  , content);
          // console.log('android', request)
          
      }
      if(utility.issetVal(data.ios)){
           utility.requestFCM("ios"
                  , firebase.base_url
                  , firebase.server_key
                  , data.ios
                  , content);
          // console.log('android', request)
      }
      response.setSuccess(200, "Fetch Success", data);
      return response.send(res);
    } catch (error) {
      response.setError(400, error.message);
      return response.send(res);
    }
  }
}

module.exports = sandboxController;
