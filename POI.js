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


function getPlace(ans, poiName) {
    for (let i = 0; i < ans.length; i++) {
        if (ans[i].poi_name !== poiName) {
            continue;
        }
        return ans[i].place;
    }
    return -1;
}

router.use('/', function (req, res, next) {
    if (undefined === req.decoded) {
        res.sendStatus(498)
    }
    else {
        next();
    }
});


router.get("/getAllPOI", function (req, res) {

    //language=SQLite
    const query = `SELECT *
                   FROM [POI]`;
    DButilsAzure.execQuery(query)
        .then(function (ans) {
            let result = ansToJson(ans);
            res.send(result);
        })
        .catch(function (err) {
            console.log(err.message);
        })


});

router.get('/save', function (req, res) {


    let pois = [];
    let sorted = [];
    const username = req.decoded.payload.UserName;
    //language=SQLite
    const query = `SELECT * FROM [POI] WHERE [PoiName] IN (SELECT [poi_name] FROM [SavePOI] WHERE username = '${username}')`;

    DButilsAzure.execQuery(query)
        .then(function (p) {
            pois = p;
            //language=SQLite
            const querySort = `SELECT * FROM [SavePOI] WHERE username = '${username}'`;
            DButilsAzure.execQuery(querySort)
                .then(function (ans) {
                    sorted = sort(ans);
                    let result = [];
                    for (let i = 0; i < pois.length; i++) {
                        let place = getPlace(sorted, pois[i].PoiName);
                        result[place - 1] = pois[i];
                    }
                    res.send(result)

                })

                .catch(function (err) {
                    console.log(err.message);
                });
        })
        .catch(function (err) {
            console.log(err.message);
        });



});

router.post('/save', function (req, res) {


    const username = req.decoded.payload.UserName;
    let pois = req.body.pois;
    let promises = [];

    //language=SQLite
    const del = `DELETE FROM [SavePoi] WHERE username = '${username}'`;
    DButilsAzure.execQuery(del)
        .then(function () {
            for (let i = 0; i < pois.length; i++) {
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
                    res.send(err.message);
                })

        })
        .catch(function (err) {
            res.send(err.message);
        })


});


router.delete('/save', function (req, res) {

    const poiName = req.body.PoiName;
    const username = req.decoded.payload.UserName;
    //language=SQLite
    const query = `DELETE FROM [SavePOI] WHERE username = '${username}' AND poi_name = '${poiName}'`;
    DButilsAzure.execQuery(query)
        .then(function () {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.send(err.message);
        })

});

router.post('/review/:poiName', function (req, res) {

    const username = req.decoded.payload.UserName;
    const poiName = req.body.PoiName;
    const review = req.body.review;

    //language=SQLite
    const query = `insert into [PoiReview] values ('${username}', '${poiName}', '${review}')`;
    DButilsAzure.execQuery(query)
        .then(function () {
            res.sendStatus(200)
        })
        .catch(function (err) {
            res.send(err.message);
        })

});

router.put('/review', function (req, res) {

    const username = req.decoded.payload.UserName;
    const poiName = req.body.PoiName;
    const review = req.body.review;

    //language=SQLite
    const query = `update [PoiReview] set review = '${review}' where UserName = '${username}' and PoiName = '${poiName}'`;
    DButilsAzure.execQuery(query)
        .then(function () {
            res.sendStatus(200);
        })
        .catch(function (err) {
            res.send(err.message);
        })
});

router.get('/:poiName', function (req, res) {

    const poiName = req.params;
    //language=SQLite
    const query = `select * from [PoiInfo] where PoiName = '${poiName}'`;
    DButilsAzure.execQuery(query)
        .then(function (ans) {
            res.send(ans)
        })
        .catch(function (err) {
            res.send(err.message);
        })
});

router.delete('/save/deleteUserOrder', function (req, res) {
    const username = req.decoded.payload.UserName;
    //language=SQLite
    const query = `delete from [SavePOI] where username = '${username}'`;
    DButilsAzure.execQuery(query)
        .then(function () {
            res.sendStatus(200)
        })
        .catch(function (err) {
            res.send(err.message)
        })
});

router.post('/rank', function (req, res) {
    const username = req.decoded.payload.UserName;
    const poiName = req.body.PoiName;
    const rating = parseInt(req.body.rating);
    //language=SQLite
    const insert = `insert into [UsersRanking] ([username], [PoiName], [rank]) values ('${username}', '${poiName}', '${rating}');`;
    DButilsAzure.execQuery(insert)
        .then(function () {
            //language=SQLite
            const query = `select [Rating], [numOfRanks] from [POI] where PoiName = '${poiName}'`;
            DButilsAzure.execQuery(query)
                .then(function (ans) {
                    let counter = parseInt(ans[0].numOfRanks);
                    let rank = parseFloat(ans[0].Rating);

                    let sum = (rank * counter) + rating;
                    counter += 1;
                    let avg = sum / counter;
                    //language=SQLite
                    let update = `update [POI] set Rating = '${avg}', numOfRanks = '${counter}' where PoiName = '${poiName}'`;
                    DButilsAzure.execQuery(update)
                        .then(function () {
                            res.sendStatus(200)
                        })
                        .catch(function (err) {
                            res.send(err.message)
                        })
                })
                .catch(function (err) {
                    res.send(err.message)
                })

        })
        .catch(function (err) {
            res.send(err.message);
        })


});



module.exports = router;