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


function getNext(ans, poiName) {
    for (let i = 0; i < ans.length; i++) {
        if (poiName === ans[i].PoiName) {
            return ans[i];
        }
    }
}

router.get('/popular', function (req, res) {
    //language=SQLite
    const query = 'select * from [POI] order by [numOfRanks] desc';
    DButilsAzure.execQuery(query)
        .then(function (ans) {
            let result = [];
            for (let i = 0; i < 3 && i < ans.length; i++)
            {
                result.push(ans[i]);
            }

            res.send(result);
        })
        .catch(function (err) {
            res.send(err.message);
        })
});

router.get('/', function (req, res) {

    const poiName = req.body.poiName;
    if ('All' === poiName)
    {
        //language=SQLite
        const query = "select * from [POI]";
        DButilsAzure.execQuery(query)
            .then(function (ans) {
                res.send(ans);
            })
            .catch(function (err)
            {
                res.send(err.message);
            })
    }
    else
    {
        //language=SQLite
        const query = `select * from [PoiInfo] where PoiName = '${poiName}'`;
        DButilsAzure.execQuery(query)
            .then(function (ans) {
                if (ans.length > 0)
                {
                    res.send(ans);
                }
                else
                {
                    res.send("We couldn't find the POI");
                }
            })
            .catch(function (err) {
                res.send(err.message);
            })
    }

});

/****************************************************************
 *                      Use module
 ***************************************************************/
router.use('/', function (req, res, next) {
    if (undefined === req.decoded) {
        res.sendStatus(498)
    }
    else {
        next();
    }
});


/****************************************************************
 *                      Save module
 ***************************************************************/

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
                    sorted = ans.sort(function (a, b) {
                        return (a.place > b.place) ? 1 : (a.place < b.place) ? -1 : 0;
                    });
                    let result = [sorted.length];
                    for (let i = 0; i < sorted.length; i++) {
                        result[i] = getNext(pois, sorted[i].poi_name);
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

router.get('/save/userLast2', function (req, res) {

    const username = req.decoded.payload.UserName;
    //language=SQLite
    const query = `select [PoiName], [PoiPic], [Category], [Rating], [numOfRanks] from [POI] as p join [SavePOI] as s on p.PoiName = s.poi_name where s.username = '${username}' order by s.date desc`;
    DButilsAzure.execQuery(query)
        .then(function (ans) {
            if (ans.length === 0) {
                res.send("you didn't save any POI");
            }
            else if (ans.length <= 2) {
                res.send(ans);
            }
            else {
                let result = [ans[0], ans[1]];
                res.send(result);
            }

        })
        .catch(function (err) {
            res.send(err.message);
        })

});

router.post('/save', function (req, res) {

    const username = req.decoded.payload.UserName;
    let pois = req.body.pois;
    let promises = [];

    for (let i = 0; i < pois.length; i++) {
        let poiName = pois[i].poiName;
        let place = pois[i].place;
        //language=SQLite
        let insert = `update [SavePOI] set place = '${place}' where username = '${username}' and poi_name = '${poiName}'`;
        promises.push(DButilsAzure.execQuery(insert))
    }

    Promise.all(promises)
        .then(function () {
            res.sendStatus(200)
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


router.post('/save/:poi', function (req, res) {
    const username = req.decoded.payload.UserName;
    let poiName = req.params;
    let date = new Date().toISOString();
    //language=SQLite
    const query = `insert into [SavePOI] ([username], [poi_name], [date]) values ('${username}', '${poiName}', '${date}')`;
    DButilsAzure.execQuery(query)
        .then(function () {
            res.sendStatus(200)
        })
        .catch(function (err) {
            res.send(err.message);
        })

});

/****************************************************************
 *                      Review module
 ***************************************************************/

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

/****************************************************************
 *                      Rank module
 ***************************************************************/

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

/****************************************************************
 *                      Get module
 ***************************************************************/

router.get('/category', function (req, res) {
    const username = req.decoded.payload.UserName;
    const num = req.body.num;
    //language=SQLite
    const getCategoryQuery = `select [FirstCategory], [SecondCategory] from [Users] where [Username] = '${username}'`;
    DButilsAzure.execQuery(getCategoryQuery)
        .then(function (ans) {
            let result = [];
            const first = ans[0];
            const second = ans[1];
            //language=SQLite
            const fq = `select * from [POI] where Category = '${first}' order by [numOfRanks] desc`;
            //language=SQLite
            const sq = `select * from [POI] where Category = '${second}' order by [numOfRanks] desc`;
            DButilsAzure.execQuery(fq)
                .then(function (ans) {
                    if (ans.length >= 1) {
                        result.push(ans[0]);
                        //language=SQLite

                        DButilsAzure.execQuery(sq)
                            .then(function (ans) {
                                if (ans.length >= 1) {
                                    result.push(ans[0]);

                                }
                                res.send(result);
                            })
                            .catch(function (err) {
                                res.send(err.message);
                            })
                    }
                    else {
                        DButilsAzure.execQuery(sq)
                            .then(function (ans) {
                                if (ans.length >= 1) {
                                    result.push(ans[0]);

                                }
                                res.send(result);
                            })
                            .catch(function (err) {
                                res.send(err.message);
                            })
                    }
                })
                .catch(function (err) {
                    res.send(err.message);
                })
        })
});




module.exports = router;