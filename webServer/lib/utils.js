var constants = require('./constants');
var moment = require('moment');

exports.isValidBoolean = function (toTest) {
    //var toTest = this.req.body.isActive;
    var validBooleansArr = ['true', 'false', '1', '0'];
    if (typeof toTest !== 'string' && typeof toTest !== 'boolean' && typeof toTest !== 'number') {
        throw 'invalid type for boolean';
    }
    var i = validBooleansArr.indexOf(toTest.toString());
    if (i < 0) {
        throw 'invalid Boolean';
    }
    i = ((i + 1) % 2 === 0) ? i - 1 : i;
    return (toTest.toString() === validBooleansArr[i]);
}

var decimalRegex = new RegExp(constants.DECIMAL_REGEX);
exports.isDecimal = function (toTest) {
    if (typeof toTest !== 'string' && typeof toTest !== 'number') {
        throw 'invalid type for float';
    }
    toTest = toTest.toString();
    if (!decimalRegex.test(toTest)) {
        throw 'invalid pattern';
    }
    toTest = parseFloat(toTest.replace(',', '.'));
    try {
        if (isNaN(toTest)) {
            throw 'isNaN';
        }
    } catch (e) {
        console.log(e);
    }
    return toTest;
}

exports.adjustTimestampFromUserSetting = function (setting, datetime) {
    var momentObj = moment(datetime);
    switch (setting) {
    case 'full':
        break;
    case 'monthly':
        momentObj = momentObj.set({
            'date': 1,
            'hour': 0,
            'minute': 0,
            'second': 0
        });
        break;
    case 'daily':
        momentObj = momentObj.set({
            'hour': 0,
            'minute': 0,
            'second': 0
        });
        break;
    default:
        throw 'timestamp privately setting: ' + setting + ' is not implemented';
    }
    return momentObj.format('YYYY-MM-DD HH:mm:ss');
}

exports.isCorrectDateRange = function (startDate, endDate, maxRange) {
    if (!startDate && !endDate) {
        return -1
    }

    if (startDate && !endDate) {
        return 'endDate is not defined';
    }

    if (!startDate && endDate) {
        return 'startDate is not defined';
    }

    var startDateObj = new Date(startDate);
    var endDateObj = new Date(endDate);

    var startDateUTC = Date.UTC(startDateObj.getFullYear(), startDateObj.getMonth(), startDateObj.getDate());
    var endDateUTC = Date.UTC(endDateObj.getFullYear(), endDateObj.getMonth(), endDateObj.getDate());
    var diff = Math.floor((endDateUTC - startDateUTC) / constants.MS_PER_DAY)
    if (diff < 0) {
        return 'Range between dates is negativ';
    } else if (maxRange) {
        if (diff > maxRange) {
            return 'Range between dates is too big'
        }
    }
    return diff;
}

exports.processResultAndBeautifyDatesForGlobalAndCurrentCC = function (result) {

    var data = {
        global: {
            day: result[0][0],
            week: result[0][1],
            month: result[0][2]
        },
        group: {
            day: result[1][0],
            week: result[1][1],
            month: result[1][2]
        },
        user: {
            day: result[2][0],
            week: result[2][1],
            month: result[2][2],
        }
    }

    for (var i in data) {
        if (data[i].hasOwnProperty('week')) {
            var weekObj = moment().year(moment(data[i].week.date).format('YYYY')).week(moment(data[i].week.date).week())
            var weekStart = weekObj.day('Monday').format('MMM Do YY');
            var weekEnd = weekObj.day('Monday').add(6, 'Days').format('MMM Do YY');
            data[i].week.date = weekStart + ' -<br>' + weekEnd;
        }
        if (data[i].hasOwnProperty('day')) {
            data[i].day.date = moment(data[i].day.date).format('MMM Do YY');
        }
        if (data[i].hasOwnProperty('month')) {
            data[i].month.date = moment(data[i].month.date).format('MMM YYYY');
        }
    }
    return data;
}
