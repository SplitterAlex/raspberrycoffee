
var nodemailer = require('nodemailer'),
    emailTemplates = require('email-templates'),
    smtpPool = require('nodemailer-smtp-pool'),
    path = require('path'),
    async = require('async');

var options = (require('../config/mailing.json')).options,
    constants = require('./constants'),
    log = log = require('./log').mailing,
    templatesDir = path.resolve(__dirname, '..','mailTemplates');

var smtpOptions = {
    host: options.host,
    port: options.port,
    secure: options.secure,
};

var simpleQueryExecutors = new (require('./db/SimpleQueryExecutors'))();

var transportMailPool = nodemailer.createTransport(smtpPool(smtpOptions));

var templates = null;

emailTemplates(templatesDir, function (err, template) {
    if (err) {
        log.error(err);
        return new Error(err);
    }
    return templates = template;   
});

exports.startRestartServerNotification = function () {
/* 
 * send init mail to a dedicated admin (Defined in webServer/config/mailing.json),
 * when the server starts, to check if the mail service is working proberly
 */
    if (!options.initMailNotification.isEnabled) {
        return;   
    }
    
    var data = {
        from: options.noReplyAddress,
        to: options.initMailNotification.adminAddress,
        subject: 'Coffee Server restarted',
        text: 'The coffee server started/restarted.\nYou can disable this mail notification in the configuration file: webServer/config/mailing.json'
    }
    
    transportMailPool.sendMail(data, function (err, info) {
        if (err) {
            log.error(err);
            throw new Error(err);
        }
    });
}

exports.sendMailToUser = function (user, transaction, updatedDeposit, purpose) {

    async.waterfall([
        
        function (callback) {
            simpleQueryExecutors.query({
                sql: 'SELECT t.id, t.name, t.identifier, t.helpText, u.isEnabled, u.sent FROM emailNotificationTypes t INNER JOIN userEmailNotifications u ON t.id=u.notificationTypeId WHERE userId=?',
                args: user.userId
            })
            .then(function (result) {
                if (!result.length) {
                    log.error('There are no email settings defined for user with userid: ' + user.userId);
                    return;
                }
                var notifications = result;
                
                if (transaction.purposeId !== constants.CREDIT) {
                    return callback(null, notifications);
                }
                
                //new credit will applied
                //Set 'sent' setting for Out of money and Balance low
                async.each(notifications, function(notification, innerCallback) {
                    //log.debug(notification.identifier + ' ' + Boolean(notification.sent));
                    if (notification.id !== constants.BALANCE_LOW && notification.id !== constants.OUT_OF_MONEY) {
                        return innerCallback(null, notifications);
                    }
                        
                    if (notification.id === constants.OUT_OF_MONEY) {
                        //log.debug(updatedDeposit + ' <= ' + constants.CHEAPEST_ITEM_VALUE);
                        if (updatedDeposit <= constants.CHEAPEST_ITEM_VALUE) {
                            return innerCallback(null, notifications);
                        }
                        
                    } else if (notification.id === constants.BALANCE_LOW){
                        //log.debug(updatedDeposit + ' < ' + user.emailCreditLimitForNotification);
                        if (updatedDeposit < user.emailCreditLimitForNotification) {
                            return innerCallback(null, notifications);   
                        }
                    }
                    
                    simpleQueryExecutors.setSentInUserEmailNotifications(transaction.toDepositor, notification.id, false)
                    .then(function () {
                        var index = notifications.indexOf(notification);
                        notifications[index].sent = false;
                        return innerCallback(null, notifications);
                    }, function (err) {
                        return innerCallback(err);
                    });
                    
                }, function (err) {
                    if (err) {
                        return callback(err);   
                    }
                    callback(null, notifications);
                });
                
            }, function (err) {
                return callback('getUserEmailSettings from Database failed: Check logs/database.log for more details');
            }); 
        }
        
    ], function (err, notifications) {
        if (err) {
            return log.error(err);
        }
        
        if (!user.enableEmailNotification) {
            return;
        }
            
        async.each(notifications, function(notification, eachCallback){
        
            
            /* dont send this notification */
            if (!notification.isEnabled) {
                //console.log(notification.identifier + ' ' + Boolean(notification.isEnabled));
                return eachCallback();
            }
            //console.log(notification.identifier + ' ' + Boolean(notification.isEnabled));
            
            var send = false;
            
            /* start implementation new notifications here */
            switch (notification.id) {   
                case constants.NEW_PURCHASE:
                    if (transaction.purposeId !== constants.CREDIT && transaction.purposeId !== constants.DEBIT) {
                        send = true;
                    }
                    break;
                case constants.CREDIT_DEBIT_RECEIVED:
                    if (transaction.purposeId === constants.CREDIT || transaction.purposeId === constants.DEBIT) {
                        send = true;
                    }
                    break; 
                case constants.OUT_OF_MONEY:
                    if (updatedDeposit < constants.CHEAPEST_ITEM_VALUE && !notification.sent) {
                        send = true;
                    }
                    break;
                case constants.BALANCE_LOW:
                    if ((updatedDeposit <= user.emailCreditLimitForNotification) && !notification.sent) {
                        send = true;
                    }
                    break;
                default:
                    log.error('Reached default case in switch id from notification: ' + JSON.stringify(notification));
            }
            
            if (!send) {
                return eachCallback();    
            }
            
            var details = {
                user: {
                    name: user.firstname + ' ' + user.lastname,
                    mailAddress: user.email,
                    oldBalance: parseFloat(Math.round(user.currentDeposit * 100) / 100).toFixed(2) + ' €',
                    newBalance: parseFloat(Math.round(updatedDeposit * 100) / 100).toFixed(2) + ' €',
                    balanceNotificationLimit: parseFloat(Math.round(user.emailCreditLimitForNotification * 100) / 100).toFixed(2) + ' €',
                },
                transaction: {
                    purpose: purpose.name,
                    amount: parseFloat(Math.round((transaction.amount * transaction.quantity) * 100) / 100).toFixed(2) + ' €',
                    date: transaction.tDate,
                    note: transaction.note,
                    quantity: transaction.quantity
                }
            }
            
            //console.log(details);
            
            //render/generate template
            templates(notification.identifier, details, function (err, html, text) {
                if (err) {
                    log.error(err);
                    return eachCallback();   
                }
                var mailToSend = {
                    from: options.noReplyAddress,
                    to: details.user.mailAddress,
                    subject: notification.name,
                    text: text
                }
                
                //console.log(mailToSend);
                transportMailPool.sendMail(mailToSend, function (err, info) {
                    if (err) {
                        log.error(err);
                        return eachCallback();
                    }
                    
                    if (notification.id !== constants.BALANCE_LOW && notification.id !== constants.OUT_OF_MONEY) {
                        return eachCallback();
                    }
                    
                    simpleQueryExecutors.setSentInUserEmailNotifications(transaction.toDepositor, notification.id, true)
                    .then(function(result) {
                        eachCallback();
                    }, function (err) {
                        log.error(err);
                        eachCallback();
                    })
                });
            });
        }, function () {
           //all notifications sent...
        });
    });
};