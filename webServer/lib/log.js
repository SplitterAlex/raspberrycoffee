
var log4js = require('log4js');

module.exports = {
    default: undefined,
    pi: undefined,
    database: undefined,
    auth: undefined,
    user: undefined,
    mailing: undefined,
    
    init: function(options) {
        log4js.configure(options.config);
        
        this.default = log4js.getLogger('default');
        if (options.enableDebugLog) {
            this.default.setLevel('DEBUG');
        } else {
            this.default.setLevel('INFO');
        }
        
        this.pi = log4js.getLogger('pi');
        if (options.enableDebugLog) {
            this.pi.setLevel('DEBUG');
        } else {
            this.pi.setLevel('INFO');
        }
        
        this.database = log4js.getLogger('database');
        if (options.enableDebugLog) {
            this.database.setLevel('DEBUG');
        } else {
            this.database.setLevel('INFO');
        }
        
        this.auth = log4js.getLogger('auth');
        if (options.enableDebugLog) {
            this.database.setLevel('DEBUG');
        } else {
            this.database.setLevel('INFO');
        }
        
        this.user = log4js.getLogger('user');
        if (options.enableDebugLog) {
            this.database.setLevel('DEBUG');
        } else {
            this.database.setLevel('INFO');
        }
        
        this.mailing = log4js.getLogger('mailing');
        if (options.enableDebugLog) {
            this.mailing.setLevel('DEBUG');
        } else {
            this.mailing.setLevel('INFO');
        }

    }
};
