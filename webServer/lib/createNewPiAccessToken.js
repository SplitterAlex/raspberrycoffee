var piConfig = require('../config/config.json').pi,
    jwtOptions = require('../config/config.json').jwt,
    jwt = require('jsonwebtoken');

var tokenId = null;
var userId = null;

userId = process.argv[2];
//console.log(process.argv);

if (typeof userId === 'undefined' || userId == null) {
    console.log('Run with "$ node createNewPiAccessToken.js [userId from the raspberry pi user]"');
    return -1;
}

piConfig.every(function (obj) {
    if (userId == obj.userId) {
        //generate a random number
        tokenId = (Math.floor(Math.random() * (999999 - 111111) + 111111));
        return false;
    }
    return true;
});

if (tokenId === null) {
    console.log(userId + ' (The userId of the raspberry pi) is not defined at the server config file! Check /webServer/config/config.json');
return -1;
}

var token = jwt.sign({
        userId: userId,
        tokenId: tokenId,
        groupId: null
    }, jwtOptions.piSecret);

console.log('Store the token at /raspberryClient/token and store the tokenId at /webServer/config/config.json');
console.log('TOKEN: ' + token);
console.log('TOKEN_ID: ' + tokenId);