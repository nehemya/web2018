let express = require('express');
let bodyParser = require('body-parser');
let app = express();
let cors = require('cors');
let util = require('util');
let DButilsAzure = require('./DButils');
let users = require('./users/Users');
let poi = require('./poi/POI');
let port = 3000;
let fs = require('fs');
let xml2js = require('xml2js');
let parser = new xml2js.Parser();
let countries = [];
let jwt = require('jsonwebtoken');
let secret = 'just a random statement';


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

/*  middleware  */
app.use(function(req, res, next){
    console.log(req.method, req.url);
    let token = req.body.token || req.query.token || req.headers.token;
    if (token) {
        jwt.verify(token, secret, function (err, decoded) {
            if (err) {
                return res.json({ success: false, message: 'Failed to authenticate token.' });
            } else {
                var decoded = jwt.decode(token, {complete: true});
                req.decoded= decoded;
                next();
            }
        })
    } else next();
});

/* configure the route */
app.use('/Users', users);
app.use('/POI', poi);

app.get('/countries', function (req, res) {
    res.send(countries);
});


/* start listening */
app.listen(port, function () {
    console.log('Server listening on port ' + port);
});
//-------------------------------------------------------------------------------------------------------------------

