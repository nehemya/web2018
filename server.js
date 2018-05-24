//this is only an example, handling everything is yours responsibilty !

var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var cors = require('cors');
app.use(cors());
//ar DButilsAzure = require('./DButils');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


//complete your code here
app.get('/users', function (req, res){
    console.log('works');
})


var port = 3000;
app.listen(port, function () {
    console.log('Example app listening on port ' + port);
});
//-------------------------------------------------------------------------------------------------------------------


