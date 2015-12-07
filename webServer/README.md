# webServer Coffee-Project

## Preparation


Install GIT

Install a MySQL server

Install nodejs/npm


## Create the database

Enter mysql server with:
``` bash
$ mysql -u root -p
```
Create a database
``` bash
mysql> CREATE DATABASE <your_data_base_name>;
mysql> USE <your_data_base_name>
```
Load the /webServer/dataBaseSchema.sql file via:
``` bash
mysql> source <path_to_dataBaseSchema.sql_file>
```

## Configuration

You can find the config file at /webServer/config/config.json

Define database, ldap and mailing properties here!


## Installation

You can simply install the server via npm:

``` bash
$ npm install --production
```

Install [PM2](https://github.com/Unitech/PM2/blob/master/README.md)

or [forever](https://github.com/foreverjs/forever)

### Webclient

Run at **/webClient**:

```
$ npm install
$ bower install
$ grunt
```

The builded app will automatically copied to **/webServer/app**

## Logging and output file locations

By default the server places all log files into /webServer/logs. If you would like to change the locations or names just edit the config.json file and restart the server.

## Tests

Adjust database configurations at /webServer/test/config/config.json. (When needed!)

``` bash
$ npm install --dev
$ [sudo] TEST_RUN=active npm test
```

