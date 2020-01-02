const jwt = require('jsonwebtoken')
const utility = require('../helpers/utility')
const Response = require('../helpers/response')
const response = new Response
require('dotenv').config

module.exports = (req, res, next) =>{
  const authHeader = req.get('Authorization')
  let token = null
  if(!utility.issetVal(authHeader)){
    response.setError(401,'Unauthorization1')
    response.send(res)
  }

  try {
    token = jwt.verify(authHeader, process.env.SECRET_KEY)
  } catch (error){
    response.setError(500,error)
    response.send(res)
  }
  
  if(!utility.issetVal(token)){
    response.setError(401,'Unauthozation2')
    response.send(res)
  }

  req.token = token
  next()
}