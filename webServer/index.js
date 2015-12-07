


var server = require('./lib/server').create(),
    serverDefinitions = require('./config/config.json'),
    log = require('./lib/log'),
    restify = require('restify'),
    mail = require('./lib/mail');

server.get(/.*/, restify.serveStatic({
    directory: './app',
    default: 'index.html'
}));


server.listen(serverDefinitions.port, serverDefinitions.host, function() {
    log.default.info('%s#%s listening at %s', server.name, server.versions, server.url);
    mail.startRestartServerNotification();
});
