// const roleService = require('../services').roleService;
const Response = require('../../helpers/response');

const response = new Response();


class sandboxController {
  static async getAll(req, res) {
    try {
      response.setSuccess(200, "Pong", {'hello' :'iyaa'});
    
      return response.send(res);
    } catch (error) {
      response.setError(400, error.message);
      return response.send(res);
    }
  }
}

module.exports = sandboxController;
