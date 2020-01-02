import express from "express";
import bodyParser from "body-parser";
import logger from "morgan";
import cors from "cors";
import dotenv from "dotenv";
import path  from "path";

dotenv.config()

const axios = require('axios');
const { connect } = require('./helpers/mongoose_adapter')
const Response = require('./helpers/response');
const appDir = path.dirname(require.main.filename);

const response = new Response();
const app = new express()

app.use(logger("dev"));
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended : true}))

// www Router
import wwwV1 from "./www/routers";

// Mobile Router
import mobileV1 from "./mobile/routers";

const corsOptions = {
  allowedHeaders: ['Content-Type', 'Origin', 'X-Requested-With', 'Accept', 'access-control-allow-origin', 'appname', 'portalname'],
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE, OPTIONS',
}
app.use((req, res, next) => {
  //set headers to allow cross origin requestt
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
}); 
// Using Router API V1
app.use('/A', (req, res) => {
  res.send('Hello');
})
app.use('/api-www/v1', wwwV1);
app.use('/api-mobile/v1/', mobileV1);
app.use(cors(corsOptions))
// Static filesx
// Using Router Path Upload
app.use('/upload', express.static(__dirname + '/uploads'));

app.set('trust proxy', 1) // trust first proxyx

async function start() {
  try {
    const mongo = await connect();
    if(!mongo){
      console.log('Error: DB not connected');
    }
  }
  catch(e){
    console.log('Something when wrong!!');
  }
}


start()
module.exports =  app;
