var define = require("node-constants")(exports);
// define is a function that binds "constants" to an object (commonly exports)


define("CHEAPEST_ITEM_VALUE", 0.5);

define("MAX_KEY_LENGTH", 32);

define("MAX_PASSWORD_LENGTH", 100);
define("MIN_PASSWORD_LENGTH", 3);

define("MAX_TRANSACTION_NOTE_LENGTH", 200);

define("MS_PER_DAY", 1000 * 60 * 60 * 24);

define("MAX_USERGROUP_NAME_LENGTH", 50);
define("MAX_USERGROUP_SHORTFORM_LENGTH", 10);

define("MAX_PRODUCT_NAME_LENGTH", 20);

define("MAX_NEW_TRANSACTION_QUANTITY", 10);
define("MIN_NEW_TRANSACTION_QUANTITY", 1);

// items selectable at the coffeemachine
define({
    COFFEE: 1,
    COFFEE_LARGE: 2,
    ESPRESSO: 3,
    ESPRESSO_LARGE: 4,
    LATTE: 5,
    CAPPUCCINO: 6,
    MILK: 7,
    WATER: 8
});

define("CREDIT", 9);
define("DEBIT", 10);

// mails
define({
    NEW_PURCHASE: 1,
    CREDIT_DEBIT_RECEIVED: 2,
    OUT_OF_MONEY: 3,
    BALANCE_LOW: 4
});

//regex
define({
    "KEY_REGEX": /^[A-Fa-f0-9]{1,32}$/,
    "DATE_REGEX": /^(((\d{4})(-)(0[13578]|10|12)(-)(0[1-9]|[12][0-9]|3[01]))|((\d{4})(-)(0[469]|11)(-)([0][1-9]|[12][0-9]|30))|((\d{4})(-)(02)(-)(0[1-9]|1[0-9]|2[0-8]))|(([02468][048]00)(-)(02)(-)(29))|(([13579][26]00)(-)(02)(-)(29))|(([0-9][0-9][0][48])(-)(02)(-)(29))|(([0-9][0-9][2468][048])(-)(02)(-)(29))|(([0-9][0-9][13579][26])(-)(02)(-)(29)))$/,
    "TIMESTAMP_REGEX": /^(((\d{4})(-)(0[13578]|10|12)(-)(0[1-9]|[12][0-9]|3[01]))|((\d{4})(-)(0[469]|11)(-)([0][1-9]|[12][0-9]|30))|((\d{4})(-)(02)(-)(0[1-9]|1[0-9]|2[0-8]))|(([02468][048]00)(-)(02)(-)(29))|(([13579][26]00)(-)(02)(-)(29))|(([0-9][0-9][0][48])(-)(02)(-)(29))|(([0-9][0-9][2468][048])(-)(02)(-)(29))|(([0-9][0-9][13579][26])(-)(02)(-)(29)))(\s([0-1][0-9]|2[0-4]):([0-5][0-9]):([0-5][0-9]))$/,
    "DECIMAL_REGEX": /^[-+]?[0-9]{1,}([.,][0-9]{1,2})?$/,
    "PRODUCT_NAME_REGEX": /^[A-Za-z0-9 ]{1,20}$/,
    "USERGROUP_NAME_REGEX": /^[A-Za-z0-9 _-]{1,50}$/,
    "USERGROUP_SHORTFORM_REGEX": /^[A-Za-z0-9 _-]{1,10}$/,
    "USERNAME_REGEX": /^[a-zA-Z0-9_-]{3,20}$/,
    "NAME_REGEX": /^[a-zA-Z]{1,20}$/,
    "YEAR_REGEX": /^(19|20)\d{2}$/,
    "MONTH_REGEX": /^1[0-2]$|^0[1-9]$/,
    "USERNAME_SEARCHSTRING_REGEX": /^[a-zA-Z0-9_-]{1,20}$/,
    "LDAP_STUDENT_REGEX": /(^cs[a-z0-9]{1,18}$)/,
    "LDAP_INSTITUTE_REGEX": /^c\d{3,19}$/
});

/*
define("EMAIL", new RegExp(/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/));
*/