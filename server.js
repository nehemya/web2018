let express = require('express');
let bodyParser = require('body-parser');
let app = express();
let cors = require('cors');
let util = require('util');
let DButilsAzure = require('./DButils');
let users = require('./Users');
let poi = require('./POI');
let port = 3000;
let fs = require('fs');
let xml2js = require('xml2js');
let parser = new xml2js.Parser();
let countries = [];


//Read the xml file and insert to a list
fs.readFile('./countries.xml', function (err, data) {
    parser.parseString(data, function (err, result) {
        for (let i = 0; i < result.Countries.Country.length; i++) {
            const country = result.Countries.Country[i].Name;
            countries.push(country[0]);
        }

    });
});

/* configure the body parser */
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(cors());

/* configure the route */
app.use('/Users', users);
app.use('/POI', poi);


/* start listening */
app.listen(port, function () {
    console.log('Server listening on port ' + port);
});
//-------------------------------------------------------------------------------------------------------------------


