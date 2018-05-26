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

router.get('/getAllPOI', function (req,res) {
    //language=SQLite
    const query = `SELECT * FROM [POI]`;
    DButilsAzure.execQuery(query)
        .then(function (ans) {
            let result=[];
            for(let i=0;i<ans.length;i++){
                result[i]= {"PoiName" : ans[i].PoiName , "PoiPic" : ans[i].PoiPic,
                    "Category":ans[i].Category, "Rating":ans[i].Rating};
            }
            res.send(JSON.stringify(result));
        })
        .catch(function (err) {
            console.log('connection fail')
        })
})



module.exports = router;