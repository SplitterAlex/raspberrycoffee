var constants = require('../constants');

var SQLQueries = function () {
    this.sumCoffees =
        ' COALESCE ( \
            SUM ( \
                CASE purposeId \
                    WHEN ' + constants.COFFEE + ' THEN 1 \
                    WHEN ' + constants.COFFEE_LARGE + ' THEN 2 \
                    WHEN ' + constants.ESPRESSO + ' THEN 1 \
                    WHEN ' + constants.ESPRESSO_LARGE + ' THEN 2 \
                    WHEN ' + constants.LATTE + ' THEN 1 \
                    WHEN ' + constants.CAPPUCCINO + ' THEN 1 \
                    ELSE 0 \
                END \
            ), \
        0)';

    this.excludePurposes =
        ' NOT ( \
            t.purposeId=' + constants.CREDIT + ' \
            OR t.purposeId=' + constants.DEBIT + ' \
            OR t.purposeId=' + constants.MILK + ' \
            OR t.purposeId=' + constants.WATER + ' \
        )';

}

SQLQueries.prototype = (function () {


    function defineStaticQuery(key, statement) {
        Object.defineProperty(this, key, {
            value: statement,
            enumerable: true,
            writable: false,
            configurable: false
        });
    }

    function getTransacationsFromUser(filter) {
        return 'SELECT t.*, p.name AS purposeName, CONCAT(u.firstname, " ", u.lastname) AS originator FROM transactions t INNER JOIN transactionPurposes p ON t.purposeId=p.id INNER JOIN users u ON u.userId=t.fromTaker WHERE t.toDepositor=? AND (DATE(t.tDate) BETWEEN ? AND ?) ' + filter + ' ORDER BY t.id DESC LIMIT ?,30';
    }

    function getTop10RankingsSQLs(groupId, year, month, purpose) {
        var sql;
        if (purpose === 'groups') {
            sql =
                'SELECT ' +
                'g.id, ' +
                'g.name, ' +
                this.sumCoffees + ' as total ' +
                ' FROM ' +
                ' transactionStatistic t RIGHT JOIN userGroups g ON g.id=t.groupId ';

            if (year || month) {
                sql = sql + ' WHERE ';
            }

            if (year) {
                sql = sql + ' YEAR(t.tDate)=' + year + ' ';
            }

            if (month) {
                if (year) {
                    sql = sql + ' AND ';
                }
                sql = sql + ' MONTH(t.tDate)=' + month + ' ';
            }
            sql =
                sql +
                ' GROUP BY ' +
                ' t.groupId ' +
                ' ORDER BY ' +
                ' total DESC, ' +
                ' t.groupId ASC ' +
                ' LIMIT ' +
                ' 10 ';
        } else {
            sql =
                'SELECT ' +
                'u.userId as id, ' +
                this.sumCoffees + ' as total, ' +
                ' if(u.showNameInRanking=1, CONCAT(u.firstname, " ", u.lastname), "********** **********") AS name ' +
                ' FROM ' +
                ' transactions t RIGHT JOIN users u ON t.toDepositor=u.userId ';

            if (groupId || year || month) {
                sql = sql += ' WHERE ';
            }

            if (groupId) {
                sql = sql + ' u.groupId=' + groupId + ' ';
            }

            if (year) {
                if (groupId) {
                    sql = sql + ' AND ';
                }
                sql = sql + ' YEAR(t.tDate)=' + year + ' ';
            }

            if (month) {
                if (year || groupId) {
                    sql = sql + ' AND ';
                }
                sql = sql + ' MONTH(t.tDate)=' + month + ' ';
            }

            sql =
                sql +
                ' GROUP BY ' +
                ' u.userId ' +
                ' ORDER BY ' +
                ' total DESC, ' +
                ' u.userId ASC ' +
                'LIMIT ' +
                ' 10 ';
        }
        return sql;
    }

    return {

        constructor: SQLQueries,

        getSumCoffees: function () {
            return this.sumCoffees;
        },

        getExcludePurposes: function () {
            return this.excludePurposes;
        },

        defineStaticQuery: defineStaticQuery,

        SELECT_TRANSACTIONS_FROM_USER: getTransacationsFromUser,
        
        SELECT_TOP10_RANINKGS: getTop10RankingsSQLs


    }
})();


var sqlQueries = new SQLQueries();

//GET_USER_FROM_USER_ID
sqlQueries.defineStaticQuery('GET_USER_FROM_USER_ID', 'SELECT u.userId, u.username, u.firstname, u.lastname, u.email, u.currentDeposit, u.groupId, u.isActive, u.isBlocked, u.isAdmin, u.deleted, u.debtLimit, u.ldapAuth, u.enableEmailNotification, u.emailCreditLimitForNotification, u.timeStampPrivatelySetting, u.showNameInRanking, g.name AS groupName, g.shortForm AS groupShortForm FROM users u LEFT JOIN userGroups g ON u.groupId = g.id WHERE userId=?');

//UPDATE_USER_SETTING
sqlQueries.defineStaticQuery('UPDATE_USER_SETTING', 'UPDATE users SET ? WHERE userId=?');

//SELECT_USERS
sqlQueries.defineStaticQuery('SELECT_USERS', 'SELECT u.userId, u.username, CONCAT(u.firstname, " ", u.lastname) AS name, u.currentDeposit, u.groupId, u.debtLimit, u.isBlocked, u.deleted, g.name AS groupName, g.shortForm AS groupShortForm FROM users u LEFT JOIN userGroups g ON u.groupId=g.id WHERE u.deleted=0 AND (u.username LIKE ? OR u.lastname LIKE ? OR u.firstname LIKE ?) ORDER BY u.userid');

//SELECT_TRANSACTION_PURPOSES_FROM_ID
sqlQueries.defineStaticQuery('SELECT_TRANSACTION_PURPOSES_FROM_ID', 'SELECT * FROM transactionPurposes WHERE id=?');

//UPDATE_SENT_IN_USER_EMAIL_NOTIFICATIONS
sqlQueries.defineStaticQuery('UPDATE_SENT_IN_USER_EMAIL_NOTIFICATIONS', 'UPDATE userEmailNotifications SET sent=? WHERE userId=? AND notificationTypeId=?');

//SELECT_FROM_TRANSACTIONS_WITHOUT_DATE_RANGE
sqlQueries.defineStaticQuery('SELECT_FROM_TRANSACTIONS_WITHOUT_DATE_RANGE', 'SELECT t.*, p.name AS purposeName, CONCAT(o.firstname, " ", o.lastname) AS originator, CONCAT(d.firstname, " ", d.lastname) AS depositor FROM transactions t INNER JOIN transactionPurposes p ON t.purposeId = p.id INNER JOIN users o ON o.userId = t.fromTaker INNER JOIN users d ON d.userid = t.toDepositor ORDER BY t.id DESC LIMIT 0, 200');

//SELECT_FROM_TRANSACTIONS_WITH_DATE_RANGE
sqlQueries.defineStaticQuery('SELECT_FROM_TRANSACTIONS_WITH_DATE_RANGE', 'SELECT t.*, p.name AS purposeName, CONCAT(o.firstname, " ", o.lastname) AS originator, CONCAT(d.firstname, " ", d.lastname) AS depositor FROM transactions t INNER JOIN transactionPurposes p ON t.purposeId = p.id INNER JOIN users o ON o.userId = t.fromTaker INNER JOIN users d ON d.userid = t.toDepositor WHERE (DATE(t.tDate) BETWEEN ? AND ?) ORDER BY t.id DESC LIMIT 0, 200');

//SELECT_RANKING_PLACE_FROM_USER
sqlQueries.defineStaticQuery('SELECT_RANKING_PLACE_FROM_USER', 'SELECT rank, (SELECT COUNT(*) FROM users) as challengers FROM (SELECT @rn:=@rn+1 AS rank, t1.* FROM (SELECT ' + sqlQueries.getSumCoffees() + ' as total, u.userId FROM transactions t RIGHT JOIN users u ON t.toDepositor=u.userId GROUP BY u.userId ORDER BY total DESC, u.userId ASC ) t1, (SELECT @rn:=0) t2) t3 WHERE t3.userId=?');

//SELECT_RANKING_PLACE_FROM_USER_IN_GROUP
sqlQueries.defineStaticQuery('SELECT_RANKING_PLACE_FROM_USER_IN_GROUP', 'SELECT rank, (SELECT COUNT(*) FROM users WHERE groupId=?) as challengers FROM (SELECT @rn:=@rn+1 AS rank, t1.* FROM (SELECT ' + sqlQueries.getSumCoffees() + ' as total, u.userId FROM transactions t RIGHT JOIN users u ON t.toDepositor=u.userId WHERE u.groupId=? GROUP BY u.userId ORDER BY total DESC, u.userId ASC ) t1, (SELECT @rn:=0) t2) t3 WHERE t3.userId=?');

//SELECT_SUM_OF_COFFEES
sqlQueries.defineStaticQuery('SELECT_SUM_OF_COFFEES', 'SELECT ' + sqlQueries.getSumCoffees() + ' as counter FROM transactionStatistic');

//SELECT_SUM_OF_COFFEES_FROM_GROUP
sqlQueries.defineStaticQuery('SELECT_SUM_OF_COFFEES_FROM_GROUP', 'SELECT ' + sqlQueries.getSumCoffees() + ' as counter FROM transactionStatistic WHERE groupId=?');

//SELECT_SUM_OF_COFFEES_FROM_USER
sqlQueries.defineStaticQuery('SELECT_SUM_OF_COFFEES_FROM_USER', 'SELECT ' + sqlQueries.getSumCoffees() + ' as counter FROM transactions WHERE toDepositor=?');

/*
 * Max coffee consumption per day, per week, per month. Global-Group-User
 */
sqlQueries.defineStaticQuery(
    'SELECT_MAX_CC',
    '(SELECT  IFNULL(MIN(count),0) as count, IFNULL(date, ?) as date FROM((SELECT ' + sqlQueries.getSumCoffees() + ' AS count, DATE(tDate) AS date FROM transactionStatistic GROUP BY DATE(tDate) ORDER BY count DESC, tDate DESC LIMIT 1)) t1) UNION ALL (SELECT  IFNULL(MIN(count),0) as count, IFNULL(date, ?) as date FROM((SELECT ' + sqlQueries.getSumCoffees() + ' AS count, DATE(tDate) AS date FROM transactionStatistic GROUP BY YEAR(tDate), WEEK(DATE(tDate),3) ORDER BY count DESC, tDate DESC LIMIT 1)) t2) UNION ALL (SELECT  IFNULL(MIN(count),0) as count, IFNULL(date, ?) as date FROM((SELECT ' + sqlQueries.getSumCoffees() + ' AS count, DATE(tDate) AS date FROM transactionStatistic GROUP BY YEAR(tDate), MONTH(tDate) ORDER BY count DESC, tDate DESC LIMIT 1)) t3)');

sqlQueries.defineStaticQuery(
    'SELECT_MAX_CC_FROM_GROUP',
    '(SELECT  IFNULL(MIN(count),0) as count, IFNULL(date, ?) as date FROM((SELECT ' + sqlQueries.getSumCoffees() + ' AS count, DATE(tDate) AS date FROM transactionStatistic WHERE groupId=? GROUP BY DATE(tDate) ORDER BY count DESC, tDate DESC LIMIT 1)) t1) UNION ALL (SELECT  IFNULL(MIN(count),0) as count, IFNULL(date, ?) as date FROM((SELECT ' + sqlQueries.getSumCoffees() + ' AS count, DATE(tDate) AS date FROM transactionStatistic WHERE groupId=? GROUP BY YEAR(tDate), WEEK(DATE(tDate),3) ORDER BY count DESC, tDate DESC LIMIT 1)) t2) UNION ALL (SELECT  IFNULL(MIN(count),0) as count, IFNULL(date, ?) as date FROM((SELECT ' + sqlQueries.getSumCoffees() + ' AS count, DATE(tDate) AS date FROM transactionStatistic WHERE groupId=? GROUP BY YEAR(tDate), MONTH(tDate) ORDER BY count DESC, tDate DESC LIMIT 1)) t3)');

sqlQueries.defineStaticQuery(
    'SELECT_MAX_CC_FROM_USER',
    '(SELECT  IFNULL(MIN(count),0) as count, IFNULL(date, ?) as date FROM((SELECT ' + sqlQueries.getSumCoffees() + ' AS count, DATE(tDate) AS date FROM transactions WHERE toDepositor=? GROUP BY DATE(tDate) ORDER BY count DESC, tDate DESC LIMIT 1)) t1) UNION ALL (SELECT  IFNULL(MIN(count),0) as count, IFNULL(date, ?) as date FROM((SELECT ' + sqlQueries.getSumCoffees() + ' AS count, DATE(tDate) AS date FROM transactions WHERE toDepositor=? GROUP BY YEAR(tDate), WEEK(DATE(tDate),3) ORDER BY count DESC, tDate DESC LIMIT 1)) t2) UNION ALL (SELECT  IFNULL(MIN(count),0) as count, IFNULL(date, ?)  as date FROM((SELECT ' + sqlQueries.getSumCoffees() + ' AS count, DATE(tDate) AS date FROM transactions WHERE toDepositor=? GROUP BY YEAR(tDate), MONTH(tDate) ORDER BY count DESC, tDate DESC LIMIT 1)) t3)');

/*
 * Current coffee consumption per day, per week, per month. Global-Group-User
 */
sqlQueries.defineStaticQuery(
    'SELECT_CURRENT_CC', '(SELECT ' + sqlQueries.getSumCoffees() + ' AS count, ? AS date FROM transactionStatistic WHERE DATE(tDate)=?) UNION ALL (SELECT ' + sqlQueries.getSumCoffees() + ' AS count, ? AS date FROM transactionStatistic WHERE YEAR(tDate)=YEAR(?) AND WEEK(DATE(tDate),3)=WEEK(?,3)) UNION ALL (SELECT ' + sqlQueries.getSumCoffees() + ' AS count, ? AS date FROM transactionStatistic WHERE YEAR(tDate)=YEAR(?) AND MONTH(tDate)=MONTH(?))');

sqlQueries.defineStaticQuery(
    'SELECT_CURRENT_CC_FROM_GROUP', '(SELECT ' + sqlQueries.getSumCoffees() + ' AS count, ? AS date FROM transactionStatistic WHERE groupId=? AND DATE(tDate)=?) UNION ALL (SELECT ' + sqlQueries.getSumCoffees() + ' AS count, ? AS date FROM transactionStatistic WHERE groupId=? AND YEAR(tDate)=YEAR(?) AND WEEK(DATE(tDate),3)=WEEK(?,3)) UNION ALL (SELECT ' + sqlQueries.getSumCoffees() + ' AS count, ? AS date FROM transactionStatistic WHERE  groupId=? AND YEAR(tDate)=YEAR(?) AND MONTH(tDate)=MONTH(?))');

sqlQueries.defineStaticQuery(
    'SELECT_CURRENT_CC_FROM_USER', '(SELECT ' + sqlQueries.getSumCoffees() + ' AS count, ? AS date FROM transactions WHERE toDepositor=? AND DATE(tDate)=?) UNION ALL (SELECT ' + sqlQueries.getSumCoffees() + ' AS count, ? AS date FROM transactions WHERE toDepositor=? AND YEAR(tDate)=YEAR(?) AND WEEK(DATE(tDate),3)=WEEK(?,3)) UNION ALL (SELECT ' + sqlQueries.getSumCoffees() + ' AS count, ? AS date FROM transactions WHERE toDepositor=? AND YEAR(tDate)=YEAR(?) AND MONTH(tDate)=MONTH(?))');

/*
 * COFFEE CONSUMPTION Global, group, user
 */
sqlQueries.defineStaticQuery('SELECT_SUM_OF_COFFEES_PER_TYPE_WITHIN_DATE_RANGE',
    'SELECT t.purposeId as id, COUNT(*) AS data, p.name AS label FROM transactionStatistic t INNER JOIN transactionPurposes p ON t.purposeId=p.id WHERE DATE(t.tDate) BETWEEN ? AND ? AND ' + sqlQueries.getExcludePurposes() + ' GROUP BY t.purposeId')

sqlQueries.defineStaticQuery('SELECT_SUM_OF_COFFEES_PER_TYPE_WITHIN_DATE_RANGE_FROM_GROUP',
    'SELECT t.purposeId as id, COUNT(*) AS data, p.name AS label FROM transactionStatistic t INNER JOIN transactionPurposes p ON t.purposeId=p.id WHERE groupId=? AND DATE(t.tDate) BETWEEN ? AND ? AND ' + sqlQueries.getExcludePurposes() + ' GROUP BY t.purposeId')

sqlQueries.defineStaticQuery('SELECT_SUM_OF_COFFEES_PER_TYPE_WITHIN_DATE_RANGE_FROM_USER',
    'SELECT t.purposeId as id, COUNT(*) AS data, p.name AS label FROM transactions t INNER JOIN transactionPurposes p ON t.purposeId=p.id WHERE t.toDepositor=? AND DATE(t.tDate) BETWEEN ? AND ? AND ' + sqlQueries.getExcludePurposes() + ' GROUP BY t.purposeId')

/*
 * Custom Range statistics, global, group, user
 */
sqlQueries.defineStaticQuery('SELECT_SUM_OF_COFFEES_PER_TYPE_WITHIN_DATE_RANGE_GROUP_BY_DATE',
    'SELECT DATE(t.tDate) AS date, t.purposeId, p.name, COUNT(*) AS purposeCount FROM transactionStatistic t INNER JOIN transactionPurposes p ON t.purposeId=p.id WHERE (DATE(t.tDate) BETWEEN ? AND ?) AND ' + sqlQueries.getExcludePurposes() + ' GROUP BY DATE(t.tDate), t.purposeId ORDER BY DAY(t.tDate), t.purposeId');

sqlQueries.defineStaticQuery('SELECT_SUM_OF_COFFEES_PER_TYPE_WITHIN_DATE_RANGE_GROUP_BY_DATE_FROM_GROUP',
    'SELECT DATE(t.tDate) AS date, t.purposeId, p.name, COUNT(*) AS purposeCount FROM transactionStatistic t INNER JOIN transactionPurposes p ON t.purposeId=p.id WHERE t.groupId=? AND (DATE(t.tDate) BETWEEN ? AND ?) AND ' + sqlQueries.getExcludePurposes() + ' GROUP BY DATE(t.tDate), t.purposeId ORDER BY DAY(t.tDate), t.purposeId')

sqlQueries.defineStaticQuery('SELECT_SUM_OF_COFFEES_PER_TYPE_WITHIN_DATE_RANGE_GROUP_BY_DATE_FROM_USER',
    'SELECT DATE(t.tDate) AS date, t.purposeId, p.name, COUNT(*) AS purposeCount FROM transactions t INNER JOIN transactionPurposes p ON t.purposeId=p.id WHERE t.toDepositor=? AND (DATE(t.tDate) BETWEEN ? AND ?) AND ' + sqlQueries.getExcludePurposes() + ' GROUP BY DATE(t.tDate), t.purposeId ORDER BY DAY(t.tDate), t.purposeId');

/*
 * Daily statistics, global, group, user
 */
sqlQueries.defineStaticQuery('SELECT_SUM_OF_COFFEES_BY_SPECIFIC_DATE', 'SELECT DATE_FORMAT(tDate, GET_FORMAT(DATE, "ISO")) AS date, HOUR(tDate) as hour, ' + sqlQueries.getSumCoffees() + ' AS total FROM transactionStatistic WHERE (DATE(tDate)=? OR DATE(tDate)=?) GROUP BY DATE(tDate), HOUR(tDate)');

sqlQueries.defineStaticQuery('SELECT_SUM_OF_COFFEES_BY_SPECIFIC_DATE_FROM_GROUP',
    'SELECT DATE_FORMAT(tDate, GET_FORMAT(DATE, "ISO")) AS date, HOUR(tDate) as hour, ' + sqlQueries.getSumCoffees() + ' AS total FROM transactionStatistic WHERE groupId=? AND (DATE(tDate)=? OR DATE(tDate)=?) GROUP BY DATE(tDate), HOUR(tDate)');

sqlQueries.defineStaticQuery('SELECT_SUM_OF_COFFEES_BY_SPECIFIC_DATE_FROM_USER',
    'SELECT DATE_FORMAT(tDate, GET_FORMAT(DATE, "ISO")) AS date, HOUR(tDate) as hour, ' + sqlQueries.getSumCoffees() + ' AS total FROM transactions WHERE toDepositor=? AND (DATE(tDate)=? OR DATE(tDate)=?) GROUP BY DATE(tDate), HOUR(tDate)');

/*
 * Year statistics, global, group, user
 */
sqlQueries.defineStaticQuery('SELECT_SUM_OF_COFFEES_PER_MONTHS', 'SELECT MONTH(tDate) AS month, YEAR(tDate) AS year, ' + sqlQueries.getSumCoffees() + ' AS data FROM transactionStatistic WHERE (YEAR(tDate)=? OR YEAR(tDate)=?) GROUP BY YEAR(tDate), MONTH(tDate)');

sqlQueries.defineStaticQuery('SELECT_SUM_OF_COFFEES_PER_MONTHS_FROM_GROUP',
    'SELECT MONTH(tDate) AS month, YEAR(tDate) AS year, ' + sqlQueries.getSumCoffees() + ' AS data FROM transactionStatistic WHERE groupId=? AND (YEAR(tDate)=? OR YEAR(tDate)=?) GROUP BY YEAR(tDate), MONTH(tDate)');

sqlQueries.defineStaticQuery('SELECT_SUM_OF_COFFEES_PER_MONTHS_FROM_USER',
    'SELECT MONTH(tDate) AS month, YEAR(tDate) AS year, ' + sqlQueries.getSumCoffees() + ' AS data FROM transactions WHERE toDepositor=? AND (YEAR(tDate)=? OR YEAR(tDate)=?) GROUP BY YEAR(tDate), MONTH(tDate)');

/*
 * Last week statistics, global, group, user
 */
sqlQueries.defineStaticQuery('SELECT_SUM_OF_COFFEES_PER_TYPES_FORM_LAST_WEEK', 'SELECT DAY(t.tDate) AS dayNumber, t.purposeId, p.name, COUNT(*) AS purposeCount  FROM transactionStatistic t INNER JOIN transactionPurposes p ON t.purposeId=p.id WHERE t.tDate BETWEEN ? AND ? AND ' + sqlQueries.getExcludePurposes() + ' GROUP BY DAY(t.tDate), t.purposeId ORDER BY DAY(t.tDate), t.purposeId');

sqlQueries.defineStaticQuery('SELECT_SUM_OF_COFFEES_PER_TYPES_FORM_LAST_WEEK_FROM_GROUP', 'SELECT DAY(t.tDate) AS dayNumber, t.purposeId, p.name, COUNT(*) AS purposeCount  FROM transactionStatistic t INNER JOIN transactionPurposes p ON t.purposeId=p.id WHERE groupId=? AND t.tDate BETWEEN ? AND ? AND ' + sqlQueries.getExcludePurposes() + ' GROUP BY DAY(t.tDate), t.purposeId ORDER BY DAY(t.tDate), t.purposeId');

sqlQueries.defineStaticQuery('SELECT_SUM_OF_COFFEES_PER_TYPES_FORM_LAST_WEEK_FROM_USER', 'SELECT DAY(t.tDate) AS dayNumber, t.purposeId, p.name, COUNT(*) AS purposeCount  FROM transactions t INNER JOIN transactionPurposes p ON t.purposeId=p.id WHERE toDepositor=? AND t.tDate BETWEEN ? AND ? AND ' + sqlQueries.getExcludePurposes() + ' GROUP BY DAY(t.tDate), t.purposeId ORDER BY DAY(t.tDate), t.purposeId');


module.exports = sqlQueries;