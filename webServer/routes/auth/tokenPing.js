
var restifyJwt = require('restify-jwt'),
    jwtOptions = (require('../../config/config.json')).jwt;

module.exports = {
    apply: function (server) {
        server.get('/api/tokenPing', restifyJwt({secret: jwtOptions.secret}), function (req, res, next) {
            //token is valid, token ist not expired;
            res.send(200);
            return next();
        }); 
    }
}