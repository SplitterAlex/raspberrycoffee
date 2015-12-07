/*
 * network.c
 *
 *  Created on: Jan 16, 2015
 *      Author: alex
 */

#include "network.h"

char *bearer_token;

/*
 * Function: clean_up_network
 * ----------------------------
 *   free all allocated memories.
 *
 *   http://curl.haxx.se/libcurl/c/curl_easy_cleanup.html
 *
 */
static void clean_up_network(CURL *curl, struct curl_slist *headers, char *raw_request_data) {
	curl_easy_cleanup(curl);
	curl_slist_free_all(headers);
	free(raw_request_data);
}

/*
 * Function: validate_json_item
 * ----------------------------
 *   Validate a cJSON item which get read from the authentication
 *   booking response from the server.
 *   Checks if the json item type matches with the expected type
 *   Checks if the json item key name matches with the expected
 *   key name
 *
 *	 cJSON *root:
 *	 Holds the cJSON item which get validated
 *
 *	 char *json_key_name:
 *	 Holds the expected json key name
 *
 *	 int json_type:
 *	 Holds the expected json type
 *
 *   returns: return 1 if no error occured, otherwise 0
 *
 *
 */
static int validate_json_item(cJSON *root, char *json_key_name, int json_type) {
	cJSON *item = cJSON_GetObjectItem(root, json_key_name);
	if (item == NULL) {
		_LOG_ERR_("Validate json item error! json key \"%s\" not found!\n", json_key_name);
		return 0;
	}
	int item_type = item->type;
	if (json_type == 0 || json_type == 1) {
		if (item_type == 0 || item_type == 1) {
			return 1;
		} else {
			_LOG_ERR_("[NET] Validate json item error! json value from  \"%s\" have wrong data_type."
					" Only accept true or false, but data_type is: %d! [cJSON_False 0,"
					" cJSON_True 1, cJSON_NULL 2, cJSON_Number 3, cJSON_String 4,"
					" cJSON_Array 5, cJSON_Object 6\n", json_key_name, item->type);
			return 0;
		}
	}
	if (item_type != json_type) {
		_LOG_ERR_("[NET] Validate json item error! json value from  \"%s\" have wrong data_type."
				" only accept:%d, but data_type is: %d! [cJSON_False 0, cJSON_True 1, "
				"cJSON_NULL 2, cJSON_Number 3, cJSON_String 4, cJSON_Array 5, cJSON_Object"
				" 6\n", json_key_name, json_type, item->type);
		return 0;
	}
	return 1;
}

/*
 * Function: validate_json_auth_response_object
 * ----------------------------
 *   Validate the response data from the authentication object, if
 *   its a valid json object and contains all needed data/items
 *
 *	 cJSON *root:
 *	 Pointer to the cJSON item which the validated json string get stored
 *
 *	 char *raw_json_auth_response_str:
 *	 Pointer to the response data from the authentication request.
 *
 *   returns: return 1 if no error occured, otherwise 0
 *
 */
static int validate_json_auth_response_object(cJSON *root_response) {
	if (!validate_json_item(root_response, "authenticated", cJSON_True)) {
		return 0;
	}

	if (cJSON_GetObjectItem(root_response, "authenticated")->type) {
		if (!validate_json_item(root_response, "user_id", cJSON_Number)) {
			return 0;
		}

		if (!validate_json_item(root_response, "authorized", cJSON_True)) {
			return 0;	
		}
		
		if (cJSON_GetObjectItem(root_response, "authorized")->type) {
			cJSON *enabled_products = cJSON_GetObjectItem(root_response, "enabled_products");
			if (enabled_products == NULL || enabled_products->type != cJSON_Array) {
				_LOG_ERR_("[NET] %s\n", "Validation Error: Authentication response object -> JSON object 'enabled_products' not found!");
				return 0;
			}
			int arr_size = cJSON_GetArraySize(enabled_products);
			if (arr_size != 8) {
				_LOG_ERR_("[NET] Validation Error: Array size of 'enabled_products' have not expected (8) length: %d\n", arr_size);
				return 0;
			}
			int i;
			for (i = 0; i < arr_size; i++) {
				cJSON *item = cJSON_GetArrayItem(enabled_products, i);
				if (item == NULL || !validate_json_item(item, "id", cJSON_Number) || !validate_json_item(item, "is_enabled", cJSON_True)) {
					_LOG_ERR_("[NET] Validaton Error: In 'enabled_products' at index %d\n", i);
					return 0;
				}
			}
		}
	}
	cJSON *job_to_display = cJSON_GetObjectItem(root_response, "job_to_display");
	if (job_to_display == NULL || job_to_display->type != cJSON_Object) {
	        _LOG_ERR_("[NET] %s\n", "Validation Error: Authentication response object -> JSON object 'enabled_products' not found!");
                return 0;
	}
	if (!validate_json_item(job_to_display, "time", cJSON_Number) ||
		!validate_json_item(job_to_display, "msg1", cJSON_String) ||
		!validate_json_item(job_to_display, "msg2", cJSON_String)) {
		return 0;
	}
	return 1;
}

static int validate_json_booking_response(cJSON *root_response) {
	if (!validate_json_item(root_response, "time", cJSON_Number)
		|| !validate_json_item(root_response, "msg1", cJSON_String)
		|| !validate_json_item(root_response, "msg2", cJSON_String)) {
		return 0;
	}
	return 1;
}

/*
 * Function: prepare_auth_post_data
 * ----------------------------
 *   Prepare the authentication post data.
 *   Which includes the actual date and the nfc key.
 *
 *   const char *key: holds the actually nfc key, which will
 *   authenticated
 *
 *	return a json object if no errors occured, otherwise null
 *
 */
cJSON* prepare_auth_post_data(const char *key) {
	cJSON *root = NULL;

	char time_buffer[MAX_TIME_STR_LEN];
	//char *post_data;
	int ret;

	time_t mytime;
	mytime = time(NULL);
	struct tm *time = localtime(&mytime);

	ret = strftime(time_buffer, MAX_TIME_STR_LEN, JSON_TIME_FORMAT, time);
	if (ret == 0 && time_buffer[0] != '\0') {
		_LOG_ERR_("[NETWORK] %s\n", "error in strftime()\n");
		return root;
	}
	root = cJSON_CreateObject();

	cJSON_AddStringToObject(root, "date", time_buffer);
	cJSON_AddStringToObject(root, "key", key);


	return root;
}

/*
 * Function: write_data
 * ----------------------------
 *   callback function from the authentication request.
 *   Copy the response data in a char array
 *
 *   return the size of the response, or if an error occurs 0
 *
 */
size_t write_data(void *ptr, size_t size, size_t nmemb, response *data) {
	size_t index = data->len;
	size_t n = (size * nmemb);

	// we know response data have a max size.. if its not, there went something odd wrong
	if ((size * nmemb) <= MAX_RESP_DATA_SIZE) {
		data->len += (size * nmemb);

		memcpy((data->data + index), ptr, n);
		data->data[data->len] = '\0';

	} else {
		if (data->data) {
			free(data->data);
		}
		_LOG_ERR_("[NETWORK] %s\n", "Response msg is too big");
		return 0;
	}

	//debug_print("[DEBUG] [NETWORK] data at %p size=%ld nmemb=%ld\n", ptr, size, nmemb);

	return size * nmemb;
}

/*
 * Function: key_authentication
 * ----------------------------
 *   Generate post data (date and key), send the post data to the server
 *    and return the response as a cJSON object.
 *
 *   const char *key: holds the actually nfc key, which will
 *   authenticated
 *
 *	return a json object if no error occurs, otherwise NULL
 */
cJSON* key_authentication(const char *key) {

	CURL *curl;
	CURLcode res;
	cJSON *root_request;
	cJSON *root_response = NULL;

	char *raw_request_data;

	int response_parse_error = 0;
                
        long http_resp_code;

	struct curl_slist *headers = NULL;

	root_request = prepare_auth_post_data(key);
	if (root_request == NULL || root_request == 0) {
		_LOG_ERR_("[NETWORK] %s\n", "FATAL ERROR: can't allocate cJSON root request -> possible malloc error");
		return NULL;
	}

	raw_request_data = cJSON_PrintUnformatted(root_request);

	response resp;
	resp.len = 0;
	resp.data = malloc(sizeof(char) * MAX_RESP_DATA_SIZE); /* reasonable size */

	if (NULL == resp.data) {
		_LOG_ERR_("[NETWORK] %s\n", "FATAL ERROR: Failed to allocate response data memory -> malloc error");
		cJSON_Delete(root_request);
		free(raw_request_data);
		return NULL;
	}
	resp.data[0] = '\0';

	if ((curl = curl_easy_init()) == NULL) {
		_LOG_ERR_("[NETWORK] %s\n", "FATAL ERROR: Failed to create curl handle in function key_authentication");
		free(resp.data);
		cJSON_Delete(root_request);
		free(raw_request_data);
		return NULL;
	}

	headers = curl_slist_append(headers, "Accept: application/json");
	headers = curl_slist_append(headers, "Content-Type: application/json");
        headers = curl_slist_append(headers, bearer_token);
                
	curl_easy_setopt(curl, CURLOPT_CUSTOMREQUEST, "POST");
	curl_easy_setopt(curl, CURLOPT_URL, AUTH_URL);
	curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
	curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_data);
	curl_easy_setopt(curl, CURLOPT_WRITEDATA, &resp);
	curl_easy_setopt(curl, CURLOPT_POSTFIELDS, raw_request_data);
	curl_easy_setopt(curl, CURLOPT_CONNECTTIMEOUT, 2L);


#ifdef SELF_SIGNED_CERT
	// certificate isnt signed by one of the certs in the CA bundle
	curl_easy_setopt(curl, CURLOPT_SSL_VERIFYPEER, 0L);

	// different host name, than server certificate commonName
	curl_easy_setopt(curl, CURLOPT_SSL_VERIFYHOST, 0L);

#endif
	//start http request
	res = curl_easy_perform(curl);
        
	//get HTTP code        
        curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &http_resp_code);

	for(;;) {

	if (http_resp_code == 200 && res != CURLE_ABORTED_BY_CALLBACK) {
		root_response = cJSON_Parse(resp.data);
		if (root_response == NULL) {
			_LOG_ERR_("[NET] cJSON parse error in response authentication string, parse collision at: \'%s\'\n",
					cJSON_GetErrorPtr());
			response_parse_error = 1;
		} else {
			if (!validate_json_auth_response_object(root_response)) {
				_LOG_ERR_("[NET] Can't parse/understand json response authentication object from server!\n");
				response_parse_error = 1;
			} else {
				if (!cJSON_GetObjectItem(root_response, "authenticated")->type) {
					cJSON_AddNumberToObject(root_response, "error_code", 200);
				}
				debug_print("%s\n", "break");
				break;
			}
		}
	}
                    
	if (root_response != NULL) {
		cJSON_Delete(root_response);
	}
	root_response = cJSON_CreateObject();
	cJSON_AddFalseToObject(root_response, "authenticated");

	if (response_parse_error) {
		cJSON_AddNumberToObject(root_response, "error_code", 99);
		debug_print("[DEBUG] [NET] %s\n", "request data parse error");
	} else if (http_resp_code != 200 && http_resp_code != 0) {
                cJSON_AddNumberToObject(root_response, "error_code", http_resp_code);
                _LOG_ERR_("[NET] authentication request failed. http error: %d, msg %s\n", http_resp_code, resp.data);
        } else {
		cJSON_AddNumberToObject(root_response, "error_code", res);
		_LOG_ERR_("[NETWORK_CONNECTIVITY] authentication request failed. error: %d, msg: %s\n", res, curl_easy_strerror(res));
	}
	break;
	} //end for(;;)


	cJSON_AddStringToObject(root_response, "date", cJSON_GetObjectItem(root_request, "date")->valuestring);
	cJSON_AddStringToObject(root_response, "key", cJSON_GetObjectItem(root_request, "key")->valuestring);
	free(resp.data);
	cJSON_Delete(root_request);
	clean_up_network(curl, headers, raw_request_data);
	return root_response;
}

/*
 * Function: push_booking_to_server
 * -------------------------------
 *  push booking to server
 *
 *  const char *raw_booking_str:
 *  contains data to post to the server
 *
 *  return a json object if no error occurs, otherwise NULL
 *
 */
cJSON* push_booking_to_server(const char *raw_booking_str) {
	CURL *curl;
	CURLcode res;
	cJSON *root_response = NULL;
        long http_resp_code;

	struct curl_slist *headers = NULL;
	
	response resp;
	resp.len = 0;
	resp.data = malloc(sizeof(char) * MAX_RESP_DATA_SIZE);
	if (NULL == resp.data) {
                _LOG_ERR_("[NETWORK] %s\n", "FATAL ERROR: Failed to allocate response data memory -> malloc error");
		return NULL;
	}
	resp.data[0] = '\0';

	if ((curl = curl_easy_init()) == NULL) {
		_LOG_ERR_("[NETWORK] %s\n", "FATAL ERROR: Failed to create curl handle in function push_booking_to_server");
		free(resp.data);
		return NULL;
	}

	headers = curl_slist_append(headers, "Accept: application/json");
	headers = curl_slist_append(headers, "Content-Type: application/json");
        headers = curl_slist_append(headers, bearer_token);
                
	curl_easy_setopt(curl, CURLOPT_CUSTOMREQUEST, "POST");
	curl_easy_setopt(curl, CURLOPT_URL, BOOKING_URL);
	curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
	curl_easy_setopt(curl, CURLOPT_WRITEFUNCTION, write_data);
	curl_easy_setopt(curl, CURLOPT_WRITEDATA, &resp);
	curl_easy_setopt(curl, CURLOPT_POSTFIELDS, raw_booking_str);
	curl_easy_setopt(curl, CURLOPT_CONNECTTIMEOUT, 2L);

#ifdef SELF_SIGNED_CERT
        // certificate isnt signed by one of the certs in the CA bundle
        curl_easy_setopt(curl, CURLOPT_SSL_VERIFYPEER, 0L);
        // different host name, than server certificate commonName
        curl_easy_setopt(curl, CURLOPT_SSL_VERIFYHOST, 0L); 
#endif


	res = curl_easy_perform(curl);

	//get HTTP code
        curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &http_resp_code);

	for (;;) {
                
	if (http_resp_code == 200 && res != CURLE_ABORTED_BY_CALLBACK) {
		root_response = cJSON_Parse(resp.data);
		if (root_response == NULL) {
			_LOG_ERR_("[NET] cJSON parse error in response booking\n");
		} else {
			if (!validate_json_booking_response(root_response)) {
				_LOG_ERR_("[NET] Can't parse/understand json response booking object from server!\n");
			} else {
				cJSON_AddFalseToObject(root_response, "error");
				break;
			}
		}
	}

	if (root_response != NULL) {
		cJSON_Delete(root_response);
	}
	root_response = cJSON_CreateObject();
	cJSON_AddNumberToObject(root_response, "time", 10000);
	cJSON_AddStringToObject(root_response, "msg1", "  Booking was   ");
	cJSON_AddStringToObject(root_response, "msg2", "  successfully  ");
	cJSON_AddTrueToObject(root_response, "error");
		
	//error logging
	if (http_resp_code != 200 && http_resp_code != 0) {
		_LOG_ERR_("[NET] authentication request failed. http error: %d, msg %s\n", http_resp_code, resp.data);
	} else {
		_LOG_ERR_("[NET] authentication request failed. error: %d, msg: %s\n", res, curl_easy_strerror(res));
	}
	break;
	} //end for(;;)

	curl_easy_cleanup(curl);
	curl_slist_free_all(headers);
	free(resp.data);
	//debug_print("[NET] booking reponse: %s\n", cJSON_Print(root_response));
	return root_response;
}

/*
 * Function: push_unprocessed_booking_to_server
 * -------------------------------
 * push unprocessed booking to server
 *
 *  It's the same code like push_bookings_to_server, but this function
 *  is used by a thread. To prevent rage condition, the thread has his
 *  own function...
 *
 *  const char *raw_booking_str:
 *  contains data to post to the server
 *
 *  return 1 if no error occurs, 0 if an network error occurs or -1
 *  if an fatal (memory) error occurs
 *
 */
int push_unprocessed_bookings_to_server(const char *raw_json_bookings_str) {
	CURL *curl;
	CURLcode res;
	int ret;
                long http_resp_code;

	struct curl_slist *headers = NULL;


	if ((curl = curl_easy_init()) == NULL) {
		_LOG_ERR_("[NET] %s\n", "FATAL ERROR: Failed to create curl handle in function push_unprocessed_bookings_to_server");
		return -1;
	}

	headers = curl_slist_append(headers, "Content-Type: application/json");
                headers = curl_slist_append(headers, bearer_token);

	curl_easy_setopt(curl, CURLOPT_CUSTOMREQUEST, "POST");
	curl_easy_setopt(curl, CURLOPT_URL, BOOKING_URL);
	curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);
	curl_easy_setopt(curl, CURLOPT_POSTFIELDS, raw_json_bookings_str);
	curl_easy_setopt(curl, CURLOPT_CONNECTTIMEOUT, 2L);

#ifdef SELF_SIGNED_CERT
        // certificate isnt signed by one of the certs in the CA bundle
        curl_easy_setopt(curl, CURLOPT_SSL_VERIFYPEER, 0L);

        // different host name, than server certificate commonName
        curl_easy_setopt(curl, CURLOPT_SSL_VERIFYHOST, 0L);

#endif



	res = curl_easy_perform(curl);
                
        curl_easy_getinfo(curl, CURLINFO_RESPONSE_CODE, &http_resp_code);

	if (http_resp_code == 200 && res != CURLE_ABORTED_BY_CALLBACK) {
        	ret = 1;
        } else {
        	if (http_resp_code != 0) {
                	_LOG_ERR_("[NET] send unprocessed booking failed HTTP: code: %d\n", http_resp_code);
                } else {
                	_LOG_ERR_("[NET] send unprocessed booking failed CURL: code: %d, msg: %s\n", res, curl_easy_strerror(res));
                }
		ret = 0;
	}
	fprintf(stdout, "%s\n", " ");                
	curl_easy_cleanup(curl);
	curl_slist_free_all(headers);
	return ret;
}

