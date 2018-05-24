var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();
var DButilsAzure = require('./DButils');
var cors = require('cors');
let util = require('util');
var DButilsAzure = require('./DButils');


/* configure body parser */
router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json());
router.use(cors());





module.exports = router;