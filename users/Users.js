let express = require('express');
let bodyParser = require('body-parser');
let router = express.Router();
let DButilsAzure = require('../DButils');
let cors = require('cors');
let util = require('util');
let jwt = require('jsonwebtoken');
let secret = 'just a random statement';

/* configure body parser */
router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json());
router.use(cors());

/* adding user  */
router.post('/addUser', function (req, res) {

    const username = req.body.UserName;
    const password = req.body.Password;
    const city = req.body.City;
    const firstName = req.body.FirstName;
    const lastName = req.body.LastName;
    const country = req.body.Country;
    const email = req.body.Email;
    const firstCategory = req.body.FisrtCategory;
    const secondCategory = req.body.SecondCategory;
    const qPass1 = req.body.QPassword1;
    const qPass2 = req.body.QPassword2;
    const Answer1 = req.body.Answer1;
    const Answer2 = req.body.Answer2;
    const ThirdCategory = req.body.ThirdCategory;
    const FourthCategory = req.body.FourthCategory;

    // language=TSQL
    const query = `INSERT INTO [Users] VALUES ('${firstName}', '${lastName}', '${city}', '${country}', '${email}', '${firstCategory}', '${secondCategory}', '${qPass1}', '${qPass2}', '${username}', '${password}', '${Answer1}', '${Answer2}', '${ThirdCategory}', '${FourthCategory}')`;

    DButilsAzure.execQuery(query)
        .then(function (ans) {
            res.sendStatus(200);
        })
        .catch(function (err) {
          if (err.message.includes("Email"))
          {
              res.send("This email is already taken");
          }
          else if (err.message.includes("PRIMARY"))
          {
              res.send("This username is already taken");
          }
          else
          {
              res.send("Oops. Something went wrong");
          }


        })


});
/*login to the system*/
router.post('/login', function (req, res) {
    const username = req.body.UserName;
    const password = req.body.Password;
    // language=SQLite
    const query = `SELECT * FROM [Users] WHERE [Username] = '${username}'`;
    DButilsAzure.execQuery(query)
        .then(function (ans) {
            if (password === ans[0].Pass) {
                res.send(generateToken({UserName: username}))
            }
            else res.send('login failed bad password/username');
        })
        .catch(function (err) {
            res.send('login failed bad username')
        })

})
/*get questions to restore password*/
router.get('/getQuestions/:username', function (req, res) {
    const user = req.params.username;
    // language=SQLite
    const query = `SELECT * FROM [Users] WHERE [Username] = '${user}'`;
    DButilsAzure.execQuery(query)
        .then(function (ans) {
            if (ans[0]) {// valid user
                const Q1 = ans[0].QPassword1;
                const Q2 = ans[0].QPassword2;
                res.json({
                    qPassword1: Q1,
                    qPassword2: Q2
                })
            }
            else res.send('faild: the given username not exist');
        })
        .catch(function (err) {
            res.send('faild: the given username not exist')
        })
})
/*restore the password by entering the correct answers*/
router.post('/restorePassword', function (req, res) {
    const user = req.body.UserName;
    const A1 = req.body.Answer1;
    const A2 = req.body.Answer2;
    // language=SQLite
    const query = `SELECT * FROM [Users] WHERE [Username] = '${user}'`;
    DButilsAzure.execQuery(query)
        .then(function (ans) {
            if (ans[0]) {// valid user
                if (A1 === ans[0].Answer1 && A2 === ans[0].Answer2) {
                    res.json({
                        success: true,
                        password: ans[0].Pass
                    })
                } else res.send('sorry wrong answers')
            }
            else res.send('faild: the given username not exist');
        })
        .catch(function (err) {
            res.send('faild: the given username not exist')
        })
})

/*generates the token*/
function generateToken(payload) {
    var token = jwt.sign(payload, secret);
    return token;
}


module.exports = router;