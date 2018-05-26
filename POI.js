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


/* get poi*/
router.get('/:param', function (req, res) {

    const param = req.params;
    if (param === "all") {
        // language=SQLite
        const query = `SELECT * FROM [POI]`;
    }
})





module.exports = router;