var restify = require('restify');
var piLog = require('./log').pi;
var piConfig = require('../config/config.json').pi;

exports.authorization = function (req, res, next) {
    var id = parseInt(req.params.id);
    if (isNaN(id)) {
        return next(new restify.BadRequestError('id in url string is not a valid number'));
    }
    
    if (req.user.userId !== parseInt(req.params.id)) {
        if (!req.user.isAdmin) {
            return next(new restify.UnauthorizedError('Permission Denied'));
        }
    }
    next();
}

var logUser = require('./log').user;
exports.userLogging = function (req, res, next) {
    var route = '[' + req.method + '=' + req.url + ']';
    if ((req.params.id != req.user.userId) && (req.user.isAdmin)) {
        logUser.info(route + ' accessed from Admin with id ' + req.user.userId + '. PARAMS=' + JSON.stringify(req.params));
    } else {
        logUser.info(route + ' accessed from User with id ' + req.user.userId + '. PARAMS=' + JSON.stringify(req.params));
    }
}

exports.piAuthorization = function (req, res, next) {
    //console.log(req.user);
    
    if (process.env.TEST_RUN) {
        return next();
    }

    for (var i in piConfig) {
        if (req.user.userId === piConfig[i].userId && req.user.tokenId === piConfig[i].tokenId) {
            return next();
        }
    };
    piLog.error('pi authorization failed. UserId (' + req.user.userId + ') and tokenId (' + req.user.tokenId + ') not defined at webServer/config/config.json')
    return next(new restify.UnauthorizedError('pi authorization failed!'));
}