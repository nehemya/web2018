let express = require('express');
let bodyParser = require('body-parser');
let router = express.Router();
let DButilsAzure = require('./DButils');
let cors = require('cors');
let util = require('util');
DButilsAzure = require('./DButils');


/* configure body parser */
router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json());
router.use(cors());


function ansToJson(ans)
{
    let result=[];
    for(let i=0;i<ans.length;i++){
        result[i]= {"PoiName" : ans[i].PoiName , "PoiPic" : ans[i].PoiPic,
            "Category":ans[i].Category, "Rating":ans[i].Rating};
    }
    return result;
}

router.get('/getAllPOI', function (req,res) {

    if (undefined === req.decoded)
    {
        res.sendStatus(401);
    }
    else
    {
        //language=SQLite
        const query = `SELECT * FROM [POI]`;
        DButilsAzure.execQuery(query)
            .then(function (ans) {
                let result = ansToJson(ans);
                res.send(JSON.stringify(result));
            })
            .catch(function (err) {
                console.log('connection fail')
            })
    }

});

router.get('/getSaved', function (req, res) {

    if (undefined === req.decoded)
    {
        res.sendStatus(401);
    }
    else {
        const username = req.decoded.payload.UserName;
        //language=SQLite
        const query = `SELECT * FROM [POI] WHERE [PoiName] IN (SELECT [poi_name] FROM [SavePOI] WHERE username = '${username}')`;
        DButilsAzure.execQuery(query)
            .then(function (ans) {
                let result = ansToJson(ans);
                res.send(JSON.stringify(result));
            })
            .catch(function (err) {
                console.log('connection fail')
            })
    }
});






module.exports = router;