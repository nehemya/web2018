let express = require('express');
let bodyParser = require('body-parser');
let router = express.Router();
let DButilsAzure = require('../DButils');
let cors = require('cors');
let util = require('util');
DButilsAzure = require('../DButils');


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

/****************************************************************
 *                      For All users module
 ***************************************************************/

/*Get category*/
router.get('/category', function (req, res) {

    //language=SQLite
    const query = `select * from [Category]`;
    DButilsAzure.execQuery(query)
        .then(function (ans) {
            res.send(ans);
        })
        .catch(function () {
            res.send("There a weird problem");
        })
});

/*Get popular POI*/
router.get('/popular', function (req, res) {
    //language=SQLite
    const query = `select [PoiName] from [POI] where [Rating] >= 3.5`;
    DButilsAzure.execQuery(query)
        .then(function (ans) {
            let result = [];
            let max = ans.length;
            let min = 0;
            let indexes = [];

            for (let i = 0; i < 3 && i < ans.length; i++)
            {
                let index = Math.floor(Math.random() * (max - min + 1)) + min;
                while (indexes.includes(index))
                {
                    index = Math.floor(Math.random() * (max - min + 1)) + min;
                }
                indexes.push(index);
                result.push(ans[index]);
            }

            res.send(result);
        })
        .catch(function (err) {
            res.send(err.message);
        })
});

/* Get All POI or get specific POI*/
router.get('/', function (req, res) {

    const poiName = req.query.poiName;
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
                res.send("We couldn't find the POI");
            })
    }
    else
    {
        //language=SQLite
        const query = `select * from [POI] where PoiName = '${poiName}'`;
        DButilsAzure.execQuery(query)
            .then(function (ans) {
                if (ans.length > 0)
                {
                    let viewNum = parseInt(ans[0].numOfViews) + 1;
                    //language=SQLite
                    const update = `update [POI] set [numOfViews] = '${viewNum}' where PoiName = '${poiName}'`;
                    DButilsAzure.execQuery(update)
                        .then(function () {
                            ans[0].numOfViews = viewNum;
                            res.send(ans);
                        })
                        .catch(function (err) {
                            res.send(err.message);
                        })

                }
                else
                {
                    res.send("We couldn't find the POI");
                }
            })
            .catch(function () {
                res.send("We couldn't find the POI");
            })
    }

});





/****************************************************************
 *                      Use module
 ***************************************************************/

/* check token */
router.use('/', function (req, res, next) {
    if (undefined === req.decoded) {
        res.sendStatus(401)
    }
    else {
        next();
    }
});


/****************************************************************
 *                      Save module
 ***************************************************************/

/* get user saved poi by order */
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

/*get user last 2 saved poi*/
router.get('/save/userLast2', function (req, res) {

    const username = req.decoded.payload.UserName;
    //language=SQLite
    const query = `select [PoiName], [PoiPic], [Category], [Rating], [numOfRanks], [numOfViews], [desc] from [POI] as p join [SavePOI] as s on p.PoiName = s.poi_name where s.username = '${username}' order by s.date desc`;
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

/*post the user saved poi order*/
router.post('/save', function (req, res) {

    const username = req.decoded.payload.UserName;
    let pois = req.body.pois;
    let promises = [];

    for (let i = 0; i < pois.length; i++) {
        let poiName = pois[i].PoiName;
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
/*delete the saved poi*/
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
/*delete the order saved. all place set to 0*/
router.delete('/save/deleteUserOrder', function (req, res) {
    const username = req.decoded.payload.UserName;
    //language=SQLite
    const query = `update [SavePOI] set [place] = 0 where username = '${username}'`;
    DButilsAzure.execQuery(query)
        .then(function () {
            res.sendStatus(200)
        })
        .catch(function (err) {
            res.send(err.message)
        })
});

/* saves specific poi*/
router.post('/save/:poi', function (req, res) {
    const username = req.decoded.payload.UserName;
    let poiName = req.params.poi;
    let date = new Date().toISOString();
    //language=TSQL
    const query = `insert into [SavePOI] ([username], [poi_name], [date]) values ('${username}', '${poiName}', '${date}')`;

    //language=TSQL
    const check = `select PoiName from POI`;
    DButilsAzure.execQuery(check)
        .then(function (ans) {
            if (ans.includes(poiName))
            {
                DButilsAzure.execQuery(query)
                    .then(function () {
                        res.sendStatus(200)
                    })
                    .catch(function (err) {
                        res.send(err.message);
                    })
            }
            else
            {
                res.send("The POI doesn't exist")
            }
        })
        .catch(function (err) {
            res.send(err.message);
        })

});

/****************************************************************
 *                      Review module
 ***************************************************************/
/*update a review on poi*/
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
/*post a review*/
router.post('/review', function (req, res) {

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
/*add a new rank*/
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
/*get popular poi*/
router.get('/popularCategory', function (req, res) {
    const username = req.decoded.payload.UserName;
    //language=SQLite
    const getCategoryQuery = `select [FirstCategory], [SecondCategory], [ThirdCategory], [FourthCategory] from [Users] where [Username] = '${username}'`;
    DButilsAzure.execQuery(getCategoryQuery)
        .then(function (ans) {
            let category = [];
            category[0] = ans[0].FirstCategory;
            category[1] = ans[0].SecondCategory;
            category[2] = ans[0].ThridCategory;
            category[3] = ans[0].FourthCategory;

            let promises = [];
            //language=TSQL
            const fq = `select TOP(1) * from [POI] where Category = '${category[0]}' order by [numOfViews]  desc `;
            promises.push(DButilsAzure.execQuery(fq));
            //language=TSQL
            const sq = `select TOP(1) * from [POI]  where Category = '${category[1]}' order by [numOfViews] desc `;
            promises.push(DButilsAzure.execQuery(sq));
            if (category[2] !== undefined)
            {
                //language=TSQL
                const tq = `select TOP(1) * from [POI] where Category = '${category[2]}' order by [numOfViews] desc`;
                promises.push(DButilsAzure.execQuery(tq));

            }
            if (category[3] !== undefined)
            {

                // language=TSQL
                const fourthq = `select TOP(1) * from [POI] where Category = '${category[4]}' order by [numOfViews] desc`;
                promises.push(DButilsAzure.execQuery(fourthq));

            }

            Promise.all(promises)
                .then(function (ans) {
                   res.send(ans)
                })
                .catch(function () {
                    res.send("Can't retrieve POI for category");
                })


        })
        .catch(function (err) {
            res.send(err.message);
        })
});




module.exports = router;