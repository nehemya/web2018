var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var cors = require('cors');
let util = require('util');
var DButilsAzure = require('./DButils');
var users = require('./Users');
var poi = require('./POI');
var port = 3000;
var fs = require('fs');
var xml2js = require('xml2js');
var parser = new xml2js.Parser();
var countries = [];

fs.readFile('./countries.xml', function (err, data) {
    parser.parseString(data, function (err, result) {
        for (var i = 0; i < result.Countries.Country.length; i++) {
            var country = result.Countries.Country[i].Name;
            countries.push(country[0]);
        }

    });
});


app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cors());


app.use('/Users', users);
app.use('/POI', poi);


app.listen(port, function () {
    console.log('Example app listening on port ' + port);
});
//-------------------------------------------------------------------------------------------------------------------


