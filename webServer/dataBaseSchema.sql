SET sql_mode = 'STRICT_TRANS_TABLES';

CREATE TABLE userGroups (
    id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    shortForm VARCHAR(10)
);

CREATE TABLE users (
    userId INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(20) NOT NULL,
    firstname VARCHAR(20) NOT NULL,
    lastname VARCHAR(20) NOT NULL,
    displayname VARCHAR(20) DEFAULT '',
    email VARCHAR(50) NOT NULL,
    ldapAuth BOOLEAN NOT NULL,
    pwd char(60),
    debtLimit DECIMAL(10,2) NOT NULL DEFAULT 5.0,
    currentDeposit DECIMAL(10,2) NOT NULL DEFAULT 0.0,
    groupId SMALLINT UNSIGNED,
    isActive BOOLEAN DEFAULT TRUE,
    isBlocked BOOLEAN DEFAULT FALSE,
    firstLoginDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    isAdmin BOOLEAN DEFAULT FALSE,
    deleted BOOLEAN DEFAULT FALSE,
    enableEmailNotification BOOLEAN DEFAULT TRUE,
    emailCreditLimitForNotification DECIMAL(10,2) DEFAULT 2.0,
    timeStampPrivatelySetting ENUM ('full', 'monthly', 'daily') NOT NULL, /* if not null is set. The default value is the first enum state ('full')*/
    showNameInRanking boolean default true,
    FOREIGN KEY (groupId) REFERENCES userGroups(id),
    UNIQUE (username)
) AUTO_INCREMENT=111111;



CREATE TABLE nfcKeys (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    nfcKey VARCHAR(32) NOT NULL,
    owner INT UNSIGNED NOT NULL,
    dateAdded DATETIME NOT NULL,
    FOREIGN KEY (owner) REFERENCES users(userId),
    UNIQUE (nfcKey)
) AUTO_INCREMENT=11111111;


CREATE TABLE transactionPurposes (
    id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    productNumber SMALLINT UNSIGNED NOT NULL,
    name VARCHAR(20) NOT NULL,
    price DECIMAL (10,2) DEFAULT NULL,
    UNIQUE(productNumber)
);




CREATE TABLE transactions (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tDate DATETIME NOT NULL,
    fromTaker INT UNSIGNED NOT NULL,
    toDepositor INT UNSIGNED NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    note VARCHAR(200) NOT NULL,
    purposeId SMALLINT UNSIGNED NOT NULL,
    nfcKey VARCHAR(32) NOT NULL,
    deleted BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (toDepositor) REFERENCES users(userId),
    FOREIGN KEY (purposeId) REFERENCES transactionPurposes(id)
);

CREATE TABLE transactionStatistic (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    purposeId SMALLINT UNSIGNED NOT NULL,
    groupId SMALLINT UNSIGNED
);


CREATE TABLE emailNotificationTypes (
    id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    identifier VARCHAR(50) NOT NULL,
    helpText VARCHAR(300)
);

CREATE TABLE userEmailNotifications (
    id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    userId INT UNSIGNED NOT NULL,
    notificationTypeId SMALLINT UNSIGNED NOT NULL,
    isEnabled BOOLEAN DEFAULT TRUE,
    sent BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (userId) REFERENCES users(userId),
    FOREIGN KEY (notificationTypeId) REFERENCES emailNotificationTypes(id)
);

INSERT INTO userGroups (name) VALUES ('Student');
INSERT INTO userGroups (name) VALUES ('Guest');
INSERT INTO userGroups (name, shortForm) VALUES ('Quality Engineering', 'QE');
INSERT INTO userGroups (name, shortForm) VALUES ('Computational Logic', 'CL');
INSERT INTO userGroups (name, shortForm) VALUES ('Distributed and Parallel Systems', 'DPS');
INSERT INTO userGroups (name, shortForm) VALUES ('Databases and Information Systems', 'DBIS');
INSERT INTO userGroups (name, shortForm) VALUES ('Intelligent and Interactive Systems', 'IIS');
INSERT INTO userGroups (name, shortForm) VALUES ('Interaktive Grafik und Simulation', 'IGS');
INSERT INTO userGroups (name, shortForm) VALUES ('Semantic Technology Institute', 'STI');
INSERT INTO userGroups (name, shortForm) VALUES ('Security and Privacy', 'SEC');
INSERT INTO userGroups (name, shortForm) VALUES ('IFI-Staff', 'IFI');


INSERT INTO transactionPurposes (productNumber, name, price) VALUES (1, 'Coffee', 0.5);
INSERT INTO transactionPurposes (productNumber, name, price) VALUES (2, 'Coffee_Large', 1.0);
INSERT INTO transactionPurposes (productNumber, name, price) VALUES (5, 'Espresso', 0.5);
INSERT INTO transactionPurposes (productNumber, name, price) VALUES (6, 'Espresso_Large', 1.0);
INSERT INTO transactionPurposes (productNumber, name, price) VALUES (8, 'Latte', 0.5);
INSERT INTO transactionPurposes (productNumber, name, price) VALUES (9, 'Cappuccino', 0.5);
INSERT INTO transactionPurposes (productNumber, name, price) VALUES (10, 'Milk', 0.0);
INSERT INTO transactionPurposes (productNumber, name, price) VALUES (11, 'Water', 0.0);
INSERT INTO transactionPurposes (productNumber, name) VALUES (98, 'Credit');
INSERT INTO transactionPurposes (productNumber, name) VALUES (99, 'Debit');

INSERT INTO emailNotificationTypes (name, identifier, helpText) VALUES ('New purchase', 'newPurchase', 'You receive an email, when an item (e.g. coffee) is booked.');
INSERT INTO emailNotificationTypes (name, identifier, helpText) VALUES ('Credit/Debit received', 'creditDebitReceived', 'You receive a confirmation mail, when an admin transfers/debits money to/from your account.');
INSERT INTO emailNotificationTypes (name, identifier, helpText) VALUES ('Out of money', 'outOfMoney', 'You receive an email, when your balance reaches a negativ value');
INSERT INTO emailNotificationTypes (name, identifier, helpText) VALUES ('Balance low', 'balanceLow', 'You receive a reminder, when your balance reaches a defined limit.');





