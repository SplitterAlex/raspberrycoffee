/* 13 Juli 2015 */
ALTER TABLE transactionStatistic CHANGE transactionPurposeId purposeId SMALLINT UNSIGNED NOT NULL;
ALTER TABLE transactionStatistic CHANGE fullTimeStamp tDate TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP;
