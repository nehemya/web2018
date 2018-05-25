let express = require('express');
let bodyParser = require('body-parser');
let router = express.Router();
let DButilsAzure = require('./DButils');
let cors = require('cors');
let util = require('util');


/* configure body parser */
router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json());
router.use(cors());

/* adding user */
router.post('/', function (req, res) {

    const username = req.body.username;
    const password = req.body.password;
    const city = req.body.city;
    const firstName = req.body.firstName;
    const lastName = req.body.lastName;
    const country = req.body.country;
    const email = req.body.email;
    const firstCategory = req.body.fisrtCategory;
    const secondCategory = req.body.secondCategory;
    const qPass1 = req.body.qPassword1;
    const qPass2 = req.body.qPassword2;

    // language=SQLite
    const query = `INSERT INTO [Users] ([FirstName], [LastName], [City], [Country], [Email], [FirstCategory], 
                   [SecondCategory], [QPassword1], [QPassword2], [Username], [Pass]) VALUES ('${firstName}', '${lastName}', '${city}', 
                   '${country}', '${email}', '${firstCategory}', '${secondCategory}', '${qPass1}', '${qPass2}', 
                   '${username}', '${password}')`;
    //TODO: complete by the api

    res.sendStatus(200);

});

/* get method for user by username*/
router.get('/:username', function (req, res) {

    const username = req.params;
    // language=SQL
    const query = `SELECT * FROM [Users] WHERE [Username] = '${username.username}'`;
    DButilsAzure.execQuery(query)
        .then(function (result) {
            res.send(result)
        })
        .catch(function (err) {
            console.log(err)
        })
});




module.exports = router;