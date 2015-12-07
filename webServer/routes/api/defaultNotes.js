var jwtOptions = (require('../../config/config.json')).jwt,
    restifyJwt = require('restify-jwt'),
    log = require('../../lib/log').default,
    fs = require('fs'),
    path = require('path');


module.exports = {
    
    apply: function (server) {
      
    server.get('/api/client/defaultNotes', restifyJwt({secret: jwtOptions.secret}), function (req, res, next) {
        if (!req.user.isAdmin) {
            return next(new restify.UnauthorizedError('Access denied'))
        }
        
        fs.readFile(path.join(__dirname, '../../config/defaultNotes.json'), function (err, data) {
            if (err) {
                console.log(err);
                return next(new restify.InternalServerError('Cant read file defaultNotes.json. ' + err.code));
            }
            res.send(JSON.parse(data.toString()).defaultNotes);
            log.info('[' + req.method + '=' + req.url + '] accessed from User with id ' + req.user.userId + '. PARAMS=' + JSON.stringify(req.params));
        });
    });
    
    }
};