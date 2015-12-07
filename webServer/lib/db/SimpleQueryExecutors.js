var QueryExecutor = require('./QueryExecutor');
var constants = require('../constants');
var queries = require('./SQLQueries');
var Q = require('q');

function extend(B, A) {
    function I() {};
    I.prototype = A.prototype;
    B.prototype = new I;
    B.prototype.constructor = B;
    B.prototype.parent = A;
};

var SimpleQueryExecutors = function () {
    this.parent.call(this);
};

extend(SimpleQueryExecutors, QueryExecutor);

SimpleQueryExecutors.prototype.updateUserSetting = function (args) {
    return this.query({
        sql: queries.UPDATE_USER_SETTING,
        args: args
    });
}

SimpleQueryExecutors.prototype.setSentInUserEmailNotifications = function (userId, notificationType, value) {
    return this.query({
        sql: queries.UPDATE_SENT_IN_USER_EMAIL_NOTIFICATIONS,
        args: [value, userId, notificationType]
    });
}

SimpleQueryExecutors.prototype.getUsers = function (searchString) {
    return this.query({
        sql: queries.SELECT_USERS,
        args: [searchString,searchString,searchString]
    });
}

SimpleQueryExecutors.prototype.getGlobalTransactions = function (startDate, endDate) {
    var sql;
    if (startDate && endDate) {
        sql = queries.SELECT_FROM_TRANSACTIONS_WITH_DATE_RANGE;
    } else {
        sql = queries.SELECT_FROM_TRANSACTIONS_WITHOUT_DATE_RANGE;
    }
    return this.query({
        sql: sql,
        args: [startDate, endDate]
    });
}

SimpleQueryExecutors.prototype.getTransactionsFromUser = function (args, filter) {
    return this.query({
        sql: queries.SELECT_TRANSACTIONS_FROM_USER(filter),
        args: args
    });
}

SimpleQueryExecutors.prototype.getUserFromUserId = function (args) {
    return this.query({
        sql: queries.GET_USER_FROM_USER_ID,
        args: args
    });
}

SimpleQueryExecutors.prototype.getTransactionPurposeById = function (args) {
    return this.query({
        sql: queries.SELECT_TRANSACTION_PURPOSES_FROM_ID,
        args: args
    });
}

SimpleQueryExecutors.prototype.getRankingPlace = function (userId, groupId) {
    var sql;
    var args
    if (groupId) {
        sql = queries.SELECT_RANKING_PLACE_FROM_USER_IN_GROUP;
        args = [groupId, groupId, userId];
    } else {
        sql = queries.SELECT_RANKING_PLACE_FROM_USER;
        args = userId;
    }

    return this.query({
        sql: sql,
        args: args
    });
}

SimpleQueryExecutors.prototype.getCoffeeCounters = function (userId, groupId) {
    var self = this;

    return Q.all([
        self.query({
            sql: queries.SELECT_SUM_OF_COFFEES,
            args: []
        }),
        self.query({
            sql: queries.SELECT_SUM_OF_COFFEES_FROM_GROUP,
            args: groupId
        }),
        self.query({
            sql: queries.SELECT_SUM_OF_COFFEES_FROM_USER,
            args: userId
        })
    ]);
}

SimpleQueryExecutors.prototype.getMaxCoffeeConsumption = function (userId, groupId, today) {
    var self = this;
    return Q.all([
        self.query({
            sql: queries.SELECT_MAX_CC,
            args: [today, today, today]
        }),
        self.query({
            sql: queries.SELECT_MAX_CC_FROM_GROUP,
            args: [today, groupId, today, groupId, today, groupId]
        }),
        self.query({
            sql: queries.SELECT_MAX_CC_FROM_USER,
            args: [today, userId, today, userId, today, userId]
        })
    ]);
}

SimpleQueryExecutors.prototype.getCurrentCoffeeConsumption = function (userId, groupId, today) {
    var self = this;
    return Q.all([
        self.query({
            sql: queries.SELECT_CURRENT_CC,
            args: [today, today, today, today, today, today, today, today]
        }),
        self.query({
            sql: queries.SELECT_CURRENT_CC_FROM_GROUP,
            args: [today, groupId, today, today, groupId, today, today, today, groupId, today, today]
        }),
        self.query({
            sql: queries.SELECT_CURRENT_CC_FROM_USER,
            args: [today, userId, today, today, userId, today, today, today, userId, today, today]
        })
    ]);
}

SimpleQueryExecutors.prototype.getCoffeeConsumption = function (groupId, userId, startDate, endDate) {
    var sqlToProceed;
    var args;

    if (userId) {
        sqlToProceed = queries.SELECT_SUM_OF_COFFEES_PER_TYPE_WITHIN_DATE_RANGE_FROM_USER;
        args = [userId, startDate, endDate];
    } else if (groupId) {
        sqlToProceed = queries.SELECT_SUM_OF_COFFEES_PER_TYPE_WITHIN_DATE_RANGE_FROM_GROUP;
        args = [groupId, startDate, endDate];
    } else {
        sqlToProceed = queries.SELECT_SUM_OF_COFFEES_PER_TYPE_WITHIN_DATE_RANGE;
        args = [startDate, endDate];
    }
    return this.query({
        sql: sqlToProceed,
        args: args
    })
}

SimpleQueryExecutors.prototype.getCustomRangeStatistics = function (groupId, userId, startDate, endDate) {
    var sqlToProceed;
    var args;

    if (userId) {
        sqlToProceed = queries.SELECT_SUM_OF_COFFEES_PER_TYPE_WITHIN_DATE_RANGE_GROUP_BY_DATE_FROM_USER;
        args = [userId, startDate, endDate];
    } else if (groupId) {
        sqlToProceed = queries.SELECT_SUM_OF_COFFEES_PER_TYPE_WITHIN_DATE_RANGE_GROUP_BY_DATE_FROM_GROUP;
        args = [groupId, startDate, endDate];
    } else {
        sqlToProceed = queries.SELECT_SUM_OF_COFFEES_PER_TYPE_WITHIN_DATE_RANGE_GROUP_BY_DATE;
        args = [startDate, endDate];
    }
    return this.query({
        sql: sqlToProceed,
        args: args
    })

}

SimpleQueryExecutors.prototype.getDayStatistics = function (groupId, userId, mainDay, secondDay) {
    var sqlToProceed;
    var args;

    if (userId) {
        sqlToProceed = queries.SELECT_SUM_OF_COFFEES_BY_SPECIFIC_DATE_FROM_USER;
        args = [userId, mainDay, secondDay];
    } else if (groupId) {
        sqlToProceed = queries.SELECT_SUM_OF_COFFEES_BY_SPECIFIC_DATE_FROM_GROUP;
        args = [groupId, mainDay, secondDay];
    } else {
        sqlToProceed = queries.SELECT_SUM_OF_COFFEES_BY_SPECIFIC_DATE;
        args = [mainDay, secondDay];
    }
    return this.query({
        sql: sqlToProceed,
        args: args
    });

}

SimpleQueryExecutors.prototype.getMonthStatistics = function (groupId, userId, mainYear, secondYear) {
    var sqlToProceed;
    var args;

    if (userId) {
        sqlToProceed = queries.SELECT_SUM_OF_COFFEES_PER_MONTHS_FROM_USER;
        args = [userId, mainYear, secondYear];
    } else if (groupId) {
        sqlToProceed = queries.SELECT_SUM_OF_COFFEES_PER_MONTHS_FROM_GROUP;
        args = [groupId, mainYear, secondYear];
    } else {
        sqlToProceed = queries.SELECT_SUM_OF_COFFEES_PER_MONTHS;
        args = [mainYear, secondYear];
    }
    return this.query({
        sql: sqlToProceed,
        args: args
    });
}

SimpleQueryExecutors.prototype.getTop10Rankings = function (groupId, year, month, purpose) {
    return this.query({
        sql: queries.SELECT_TOP10_RANINKGS(groupId, year, month, purpose),
        args: []
    });
}

SimpleQueryExecutors.prototype.getWeekStatistics = function (groupId, userId, startThisWeek, endThisWeek, startLastWeek, endLastWeek) {
    var sqlToProceed = [];
    var args = [];

    if (userId) {
        sqlToProceed[0] = queries.SELECT_SUM_OF_COFFEES_PER_TYPES_FORM_LAST_WEEK_FROM_USER;
        sqlToProceed[1] = queries.SELECT_SUM_OF_COFFEES_PER_TYPES_FORM_LAST_WEEK_FROM_USER
        args[0] = [userId, startThisWeek, endThisWeek];
        args[1] = [userId, startLastWeek, endLastWeek];
    } else if (groupId) {
        sqlToProceed[0] = queries.SELECT_SUM_OF_COFFEES_PER_TYPES_FORM_LAST_WEEK_FROM_GROUP;
        sqlToProceed[1] = queries.SELECT_SUM_OF_COFFEES_PER_TYPES_FORM_LAST_WEEK_FROM_GROUP;
        args[0] = [groupId, startThisWeek, endThisWeek];
        args[1] = [groupId, startLastWeek, endLastWeek];
    } else {
        sqlToProceed[0] = queries.SELECT_SUM_OF_COFFEES_PER_TYPES_FORM_LAST_WEEK;
        sqlToProceed[1] = queries.SELECT_SUM_OF_COFFEES_PER_TYPES_FORM_LAST_WEEK;
        args[0] = [startThisWeek, endThisWeek];
        args[1] = [startLastWeek, endLastWeek];
    }

    return Q.all([
        this.query({
            sql: sqlToProceed[0],
            args: args[0]
        }),
        this.query({
            sql: sqlToProceed[1],
            args: args[1]
        })
    ]);
}

module.exports = SimpleQueryExecutors;