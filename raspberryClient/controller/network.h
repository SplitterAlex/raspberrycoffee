/*
 * network_connectivity.h
 *
 *  Created on: Jan 16, 2015
 *      Author: alex
 */

/* AUTH REQUEST
{
    "date": "[time_stamp]",
    "key": "[nfc_uid]"
}
*/

/* AUTH RESPONSE
{
    "authenticated": true|false,
    "authorized": true|false,
    "user_id": [user_id],
    "enabled_products": [
        {
            "id": [product_id],
            "is_enabled": true|false
        },
        {
            "id": [product_id],
            "is_enabled": true|false
        }
    ],
    "job_to_display": {
        "time": [milli_seconds],
        "msg1": "[message to print at line 1]",
        "msg2": "[message to print at line 2]"
    }
}
*/

/* BOOKING REQUEST
{
    "authenticated": true|false,
    "user_id": [user_id],
    "key": "[nfc_uid]",
    "date": "[time_stamp]",
    "item_code": [product_id]
}
*/

/* BOOKING RESPONSE
{
    "job_to_display": {
        "time": [milli_seconds],
        "msg1": "[message to print at line 1]",
        "msg2": "[message to print at line 2]"
    }
}
*/



#ifndef NETWORK_H_
#define NETWORK_H_

#include <stdio.h>
#include <stdlib.h>
#include <curl/curl.h>
#include <string.h>
#include <time.h>

#include "cJSON.h"
#include "debug.h"
#include "log.h"
#include "config.h"

#define MAX_RESP_DATA_SIZE 8096

#define MAX_TIME_STR_LEN 64

typedef struct response_data {
	size_t len;
	char* data;
} response;

extern char *bearer_token;

cJSON* key_authentication(const char *key);
cJSON* push_booking_to_server(const char *raw_booking_str);
int push_unprocessed_bookings_to_server(const char *raw_json_bookings_str);

#endif /* NETWORK_H_ */
