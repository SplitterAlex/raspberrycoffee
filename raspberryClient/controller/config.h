

#ifndef CONFIG_H_
#define CONFIG_H_


/*
 * How many seconds does a user has left
 * after his authentication to choose a
 * item from the cfe-machine, till his 
 * authentication get discarded
 */
#define TIMEOUT_AFTER_AUTH 7

/*
 * URL for the authentication request
 */
#define AUTH_URL "placeURLHere"

/*
 * URL for the booking request
 */
#define BOOKING_URL "placeURLHere"

/*
 * Backup file path
 * Where should the controller store the
 * bookings, if the web-server is not reach-
 * able
 */
#define BACKUP_FILE_PATH "/home/pi/raspberrycoffee/raspberryClient/backup_file.txt"

/*
 * Error file path
 */
#define ERR_FILE_PATH "/home/pi/raspberrycoffee/raspberryClient/logs/coffee_controller.err"

/*
 * Log file path
 */
#define LOG_FILE_PATH "/home/pi/raspberrycoffee/raspberryClient/logs/coffee_controller.log"

/*
 * Mini-Coffee-Interface device path
 */
#define MCI_DEVICE_PATH "/dev/ttyUSB0"

/*
 * Bearer token file path
 * Authorization token to access the web server - pi path's
 */
#define BEARER_TOKEN_PATH "placePathForTokenFileHere"

/*
 * Scroll Message delay in milliseconds
 * How long should the display thread wait, till he shift
 * the text char to the right
 */
#define SCROLL_DELAY 200

/*
 * Max key length
 * How long should be a readed key max from
 * the nfc-reader device
 */
#define MAX_KEY_LENGTH 32

/*
 * JSON time format
 * time format, which will be sent to the server
 * DEFAULT: "%F %H:%M:%S"
 * OUTPUT: "2015-01-31 15:23:23"
 */
#define JSON_TIME_FORMAT "%F %H:%M:%S"










#endif /* CONFIG_H_ */
