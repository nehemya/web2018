var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var cors = require('cors');
let util = require('util');
var DButilsAzure = require('./DButils');
var users = require('./Users');
var poi = require('./POI');
var port = 3000;


app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cors());


app.use('/Users', users);
app.use('/POI', poi);


app.listen(port, function () {
    console.log('Example app listening on port ' + port);
});
//-------------------------------------------------------------------------------------------------------------------


