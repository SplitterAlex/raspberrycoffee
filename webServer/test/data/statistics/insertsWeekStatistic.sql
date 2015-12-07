USE coffee_test;

INSERT INTO `transactionStatistic` (`tDate`,`purposeId`,`groupId`) VALUES (NOW(),1,1),(NOW(),6,1),(NOW() - interval 1 day,2,2),(NOW() - interval 1 day,4,1),(NOW() - interval 1 day,9,1),
(NOW() - interval 5 day,1,1),(NOW() - interval 5 day,7,1),(NOW() - interval 8 day,5,1),(NOW() - interval 8 day,6,1),(NOW() - interval 12 day,2,1),(NOW() - interval 12 day,6,2),(NOW() - interval 13 day,3,1),(NOW() - interval 13 day,6,1);

INSERT INTO `transactions` (`tDate`,`fromTaker`,`toDepositor`,`amount`,`purposeId`) VALUES (NOW(),111112,111120,"0.5",1),(NOW() - interval 1 day,111112,111120,"0.5",2),(NOW() - interval 7 day,111112,111120,"0.5",5),(NOW() - interval 13 day,111112,111120,"0.5",3);