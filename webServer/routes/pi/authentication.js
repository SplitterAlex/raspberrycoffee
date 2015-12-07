//eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOjExMTEyMywidG9rZW5JZCI6NzkyMTc0LCJncm91cElkIjoyLCJpYXQiOjE0MzIxMzQ5MTZ9.pF68aIlzQCWk158Ylywc3cCJXhJ8Vyu935n77r51phg

var log = require('../../lib/log').pi,
    restify = require('restify'),
    piConfig = require('../../config/config.json').pi,
    jwtOptions = require('../../config/config.json').jwt,
    pMsgs = require('../../config/config.json').pMsgs,
    restifyJwt = require('restify-jwt'),
    async = require('async'),
    piAuthorization = require('../../lib/commonHandlers').piAuthorization,
    constants = require('../../lib/constants');

var simpleQueryExecutors = new (require('../../lib/db/SimpleQueryExecutors'))();


module.exports = {

    apply: function (server) {

        server.post({
            url: '/api/pi/authentication',
            validation: {
                content: {
                    date: {
                        isRequired: true,
                        regex: constants.TIMESTAMP_REGEX
                    },
                    key: {
                        isRequired: true,
                        regex: constants.KEY_REGEX
                    }
                }
            }
        }, restifyJwt({
            secret: jwtOptions.piSecret
        }), piAuthorization, function (req, res, next) {

            log.info('[authentication] Authentication Request: ' + JSON.stringify(req.body));

            /* body validation */

            var key = req.body.key.toUpperCase();
            var date = req.body.date;

            async.parallel([

            function (callback) {
                    simpleQueryExecutors.query({
                        sql: 'Select * FROM transactionPurposes WHERE price IS NOT NULL',
                        args: []
                    })
                    .then(function (result) {
                        if (!result.length) {
                            log.error('[authentication] no items wit price found in table transactionPurposes');
                            return callback(new restify.InternalServerError('no items with price found in table transactionPurposes'));
                        }
                        callback(null, result);
                    }, function (err) {
                        callback(err);
                    });
            },

            function (callback) {
                    simpleQueryExecutors.query({
                        sql: 'SELECT * FROM users WHERE userId= (SELECT owner FROM nfcKeys WHERE nfcKey=?)',
                        args: key
                    })
                    .then(function (result) {
                        callback(null, result[0]);
                    }, function (err) {
                        callback(err);
                    });
            },

        ], function (err, results) {
                if (err) {
                    return next(err);
                }

                var items = results[0];
                var user = results[1];

                var resp;
                var job_to_display;
                var name_to_display;
                var authorized = true;
                var enabled_products = [];
                var pMsgI = -1;

                if (!user) {
                    log.info('[authentication] there is no user according to key: ' + key);
                    job_to_display = {
                        time: pMsgs[2].duration,
                        msg1: pMsgs[2].msg1,
                        msg2: pMsgs[2].msg2 + key
                    };
                    resp = {
                        authenticated: false,
                        job_to_display: job_to_display
                    }
                    return res.send(resp);
                }

                if (!user.isActive) {
                    authorized = false;
                    pMsgI = 1;
                }

                if (user.isBlocked) {
                    authorized = false;
                    pMsgI = 0;
                }

                if (user.deleted) {
                    authorized = false;
                    pMsgI = 5;
                }

                if (!authorized) {
                    log.info('[authentication] user with id ' + user.userId + ' authenticated, but user is not authorized: ' + pMsgs[pMsgI].desc);
                    job_to_display = {
                        time: pMsgs[pMsgI].duration,
                        msg1: pMsgs[pMsgI].msg1,
                        msg2: pMsgs[pMsgI].msg2
                    }
                    resp = {
                        authenticated: true,
                        authorized: authorized,
                        user_id: user.userId,
                        job_to_display: job_to_display
                    }
                    return res.send(resp);
                }

                var is_enabled;
                for (i in items) {
                    //console.log(items[i]);

                    if (items[i].price == 0) {
                        //console.log('price is 0');
                        is_enabled = true;
                    } else if (user.currentDeposit >= items[i].price) {
                        //console.log('user.currentDeposit >= items[i].price');
                        is_enabled = true;
                    } else if (user.currentDeposit > (user.debtLimit * -1)) {
                        var diff = user.debtLimit + user.currentDeposit;
                        if (diff >= items[i].price) {
                            //console.log('diff: ' + diff + ' >= items[i].price')
                            is_enabled = true;
                        } else {
                            //console.log('diff: ' + diff + ' < items[i].price')
                            is_enabled = false;
                        }
                    } else {
                        //console.log('else')
                        is_enabled = false;
                    }
                    var item = {
                        id: items[i].productNumber,
                        is_enabled: is_enabled
                    };
                    enabled_products[i] = item;
                }

                //show display name if set in DB, otherweise first name of user
                name_to_display = user.displayname !== '' ? user.displayname : user.firstname;

                job_to_display = {
                    time: pMsgs[4].duration,
                    msg1: pMsgs[4].msg1 + name_to_display,
                    msg2: pMsgs[4].msg2 + parseFloat(Math.round(user.currentDeposit * 100) / 100).toFixed(2)
                }

                resp = {
                    authenticated: true,
                    authorized: authorized,
                    user_id: user.userId,
                    enabled_products: enabled_products,
                    job_to_display: job_to_display,
                }

                res.send(resp);
                log.info('[authentication] Authentication response: ' + JSON.stringify(resp));
            });
        });

    }
}