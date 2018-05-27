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


function ansToJson(ans) {
    let result = [];
    for (let i = 0; i < ans.length; i++) {
        result[i] = {
            "PoiName": ans[i].PoiName, "PoiPic": ans[i].PoiPic,
            "Category": ans[i].Category, "Rating": ans[i].Rating
        };
    }
    return result;
}

function sort(ans) {
    let sorted = [];
    for (let count = 0; count < ans.length; count++) {
        let index = ans[count].place;
        sorted[index - 1] = ans[count];
    }
    return sorted;

}


function getPlace(ans, poiName)
{
    for (let i = 0; i < ans.length; i++)
    {
        if (ans[i].poi_name !== poiName)
        {
            continue;
        }
        return ans[i].place;
    }
    return -1;
}



router.get("/getAllPOI", function (req, res) {

    if (undefined === req.decoded) {
        res.sendStatus(498);
    }
    else {
        //language=SQLite
        const query = `SELECT * FROM [POI]`;
        DButilsAzure.execQuery(query)
            .then(function (ans) {
                let result = ansToJson(ans);
                res.send(result);
            })
            .catch(function (err) {
                console.log('connection fail')
            })
    }

});

router.get('/save', function (req, res) {
    if (undefined === req.decoded) {
        res.sendStatus(498);
    }
    else {

        let pois = [];
        let sorted = [];
        const username = req.decoded.payload.UserName;
        //language=SQLite
        const query = `SELECT * FROM [POI] WHERE [PoiName] IN (SELECT [poi_name] FROM [SavePOI] WHERE username = '${username}')`;

        DButilsAzure.execQuery(query)
            .then(function (p) {
                pois = p;
            })
            .catch(function (err) {
                console.log('connection fail')
            });
        //language=SQLite
        const querySort = `SELECT * FROM [SavePOI] WHERE username = '${username}'`;
        DButilsAzure.execQuery(querySort)
            .then(function (ans) {
                sorted = sort(ans);
                let result = [];
                for (let i = 0; i < pois.length; i++)
                {
                    let place = getPlace(sorted, pois[i].PoiName);
                    result[place - 1] = pois[i];
                }
                res.send(result)

            })

            .catch(function (err) {
                console.log('connection fail')
            });


    }
});

router.post('/save', function(req, res){

    if (req.decoded === undefined) {
        res.sendStatus(498);
    }
    else {
        const username = req.decoded.payload.UserName;
        let pois = req.body.pois;
        let promises = [];

        //language=SQLite
        const del = `DELETE FROM [SavePoi] WHERE username = '${username}'`;
        promises.push(DButilsAzure.execQuery(del));
        for (let i = 0; i < pois.length; i++)
        {
            let poiName = pois[i].poiName;
            let place = pois[i].place;
            //language=SQLite
            let insert = `INSERT INTO [SavePOI] VALUES ('${username}', '${poiName}', '${place}')`;
            promises.push(DButilsAzure.execQuery(insert))
        }

        Promise.all(promises)
            .then(function () {
                res.sendStatus(200)
            })
            .catch(function (err) {
                res.send(err.message())
            })


    }
});


router.delete('/save', function (req, res){
    if (undefined === req.decoded)
    {
        res.sendStatus(498)
    }
    else
    {
        const poiName = req.body.PoiName;
        const username = req.decoded.payload.UserName;
        //language=SQLite
        const query = `DELETE FROM [SavePOI] WHERE username = '${username}' AND poi_name = '${poiName}'`;
        DButilsAzure.execQuery(query)
            .then(function () {
                res.sendStatus(200);
            })
            .catch(function(err)
            {
                res.send(err.message());
            })
    }
});


module.exports = router;