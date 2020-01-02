const user = require("../../data/schema").userSchema;

class userModel {
  static async getUser(req) {
    try {
        return await user.findOne({ user_id: req.user_id })
                        .then(data =>{
                        return data;
                        }).catch(error =>{
                        throw error;
                        });
    } catch (error) {
        throw error;
    }
  }
}

module.exports = userModel;
