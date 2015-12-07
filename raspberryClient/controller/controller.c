/*
 ============================================================================
 Name        : Controller.c
 Author      : 
 Version     :
 Copyright   :
 Description :
 ============================================================================



 */

#include "controller.h"


static int main_loop = true;
static int loop_wait_for_button_press;
static int mci_has_error = false;

int th_mci_loop = true;
int th_nfc_loop = true;
int th_display_loop = true;




/*
 * Function: wait_for_item_pressing_on_coffee_machine
 * ----------------------------
 *   If the authentication and authorisation was successfully this functions
 *   wait some seconds (defined in config.h), till the user push a
 *   button at the coffee machine or the timeout expired.
 *
 *   if the timeout expired NO_ITEM_CHOOSEN is returned.
 *
 *   if the user pressed a button within the timout, the pressed key id will
 *   return, but only he is allowed to choose this item ->enabled_products.
 *
 *   if the user pressed a button, which he is not allowed to choose,
 *   ITEM_CHOOSEN_BUT_NOT_ENOUGH_CREDIT will return
 *
 *   Arguments:
 *
 *   cJSON *enabled_products
 *   If a user was successfully authenticated and authorised enabled_products holds,
 *   which products he is allowed to choose
 *   
 *   The "id" is defined in mci.h -> enum ITEMS
 *  
 *   For example:
 *   {
 *   	"enabled_products": [
 *		{ 
 *		  "id": 1,
 *		  "is_enabled": true
 *		},
 *              { 
 *                "id": 2,
 *                 "is_enabled": false
 *              },
 *              { 
 *                "id": 5,
 *                "is_enabled": true
 *              },
 *		.
 *		.
 *		.
 *              { 
 *                "id": 11,
 *                "is_enabled": true
 *              }
 *	]
 *   }
 *
 *   return:
 *   The id of the item was pressed (see mci.h - enum ITEMS),
 *	 or NO_ITEM_CHOOSEN if the timeout expired,
 *	 or ITEM_CHOOSEN_BUT_NOT_ENOUGH_CREDIT if the user pressed a button, but not enough credit
 */
static int wait_for_item_pressing_on_coffee_machine(cJSON *enabled_products) {

	int pressed_key = NO_ITEM_CHOOSEN;
	int key_is_pressed = false;
	loop_wait_for_button_press = true;

	alarm(TIMEOUT_AFTER_AUTH); //set alarm for timeout

	pthread_mutex_lock(&sdata->mutex);

	if (enabled_products == NULL) {
		sdata->offline_modus = true;
	} else {
		sdata->offline_modus = false;
		sdata->enabled_products = enabled_products;
	}
	sdata->credits_available = true;
	pthread_mutex_unlock(&sdata->mutex);

	while (loop_wait_for_button_press) {
		usleep(200000);
		pthread_mutex_lock(&sdata->mutex);
		if (sdata->selected_product != NO_ITEM_CHOOSEN) {
			alarm(0); //discard alarm, a button was pressed
			key_is_pressed = true;
			loop_wait_for_button_press = false;
			pressed_key = sdata->selected_product;
			sdata->selected_product = NO_ITEM_CHOOSEN;
			sdata->credits_available = NO_CREDIT_AVAILABLE;
		}
		pthread_mutex_unlock(&sdata->mutex);
	}

	//no key was pressed or Alarm was fired
	//check key_pressing here again. may the key was pressed
	//when the alarm was fired...
	pthread_mutex_lock(&sdata->mutex);
	if (!key_is_pressed) {
		if (sdata->selected_product != NO_ITEM_CHOOSEN) {
			pressed_key = sdata->selected_product;
		}
	}

	sdata->selected_product = NO_ITEM_CHOOSEN;
	sdata->credits_available = NO_CREDIT_AVAILABLE;
	sdata->enabled_products = NULL;
	pthread_mutex_unlock(&sdata->mutex);

	//return 6;

	return pressed_key;
}

/*
 * Function: catch_alarm
 * ----------------------------
 *   set the variable loop_wait_for_button_press to false,
 *   when the timeout(alarm) expired
 */
void catch_alarm(int sig) {
	loop_wait_for_button_press = false;
}

/*
 * Function: sig_usr
 * ----------------------------
 *   Signalhandler
 *
 *   SIGUSR1:
 *   if the singal reached at first, an error at the mini
 *   coffee interface was detected
 *   if the signal reached a second time the error was fixed
 *
 *   SIGINT, SIGTERM:
 *   Get catched to enable a gracefully shutdown.
 *
 */
void sig_usr(int sig_nr) {

	if (sig_nr == SIGUSR1) {
		debug_print("%s",
				"[DEBUG] [CONTROLLER] SIGNAL RECEIVED - SIGUSR1\n");


		if (mci_has_error) {
			_LOG_MSG_("[CONTROLLER] SECOND SIGUSR1 RECEIVED - Error fixed - mci is plugged\n");
			mci_has_error = false;
		} else {
			_LOG_MSG_("[CONTROLLER] FIRST SIGUSR1 RECEIVED - Error detected - mci unplugged/cfe-machine no power?");
			mci_has_error = true;
		}
		return;
	} else if (sig_nr == SIGINT) {

		debug_print("%s", "[DEBUG] [CONTROLLER] SIGNAL RECEIVED - SIGINT\n");
		_LOG_ERR_("[CONTROLLER] Signal SIGINT received\n");

	} else if (sig_nr == SIGTERM) {

		debug_print("%s", "[DEBUG] [CONTROLLER] SIGNAL RECEIVED - SIGTERM\n");
		_LOG_ERR_("[CONTROLLER] Signal SIGTERM received\n");

	}

	debug_print("%s\n", "[DEBUG] [CONTROLLER] Start shutdown...");
	_LOG_MSG_("[CONTROLLER] Start shutdown, cause of Signal - See error log for more details\n");
	main_loop = false;
	th_nfc_loop = false;
	th_mci_loop = false;
	th_display_loop = false;

	if (pthread_mutex_unlock(&key->mutex) != 0) {
		_LOG_ERR_("[CONTROLLER] %s\n",
				"cant unlock key_mutex in function sig_usr");
	}
	pthread_cond_signal(&key->cond);
}


/*
 * Function: start_controller
 * ----------------------------
 *
 *	Wait till a key was read from the nfc thread. Starts the authentication
 *	with the key and authorize the authenticated user. If the authentication
 *	was not possible cause of an network/server error, the key will still
 *	authorized -> OFFLINE MODUS!
 *
 *	If the authentication and authorization was successfully the available credit
 *	get passed to the mini_coffee_interface and the process wait till a user
 *	pressed an item on the cfe-machine or the timeout expired.
 *
 *	if the user pressed a valid item (enough cedit) within the timeout, the
 *	booking will send to the server, otherwise the credit and the key will
 *	reject and a new loop turn get started.
 *
 *	if the booking (to the server) was not possible cause of an network error
 *	the booking will stored at the backup file and get catch up after a success-
 *	fully booking.
 *
 */
int start_controller() {

	int ret, item_nr = 0, authenticated, start_thread = 0;

	cJSON *auth_resp, *booking_resp;
	pthread_t th_proceed_unproceed_bookings;

	if (signal(SIGALRM, catch_alarm) == SIG_ERR) {
		_LOG_ERR_("[CONTROLLER] %s\n",
				"FATAL ERROR: can't set signal_handler 'catch_alarm'");
		raise(SIGTERM);
	}
	_LOG_ERR_("[CONTROLLER] %s\n", "Controller started");
	sleep(2);
	display_msg(controller_startup_time, controller_startup_msg1, controller_startup_msg2);

	while (main_loop) {

		ret = pthread_mutex_lock(&key->mutex);
		if (ret != 0) {
			_LOG_ERR_("[CONTROLLER] %s\n", "can't lock key mutex in main_loop");
		}

		debug_print("%s",
				"[DEBUG] [CONTROLLER] Waiting for input from nfc reader ... \n");


		/*
		 * Wait here till the nfc thread read a key
		 */
		pthread_cond_wait(&key->cond, &key->mutex);

		//if an error occured (signal reached) leave the loop here
		if (!main_loop) {
			debug_print("%s\n",
					"[DEBUG] [CONTROLLER] leave main_loop in if statement");
			break;
		}

		//if mini_coffee_interface has an error, the key will reject.
		if (mci_has_error) {
			display_msg(10000, "Problem with the", "coffee interface");
			_LOG_MSG_("[CONTROLLER] %s\n", "Key from nfc raeder received, but MCI has an error -> MCI is unplugged -> discard key\n");
			ret = pthread_mutex_unlock(&key->mutex);
			if (ret != 0) {
				_LOG_ERR_("[CONTROLLER] %s\n", "Cant unlock key mutex in main_loop!");
			}
			//discard key
			memset(key->key, '\0', MAX_KEY_LENGTH);
			continue;
		}

		_LOG_MSG_("[CONTROLLER] %s\n", "Key from nfc_reader received - start authentication");
		
		// start authentication
		auth_resp = key_authentication(key->key);
		if (auth_resp == NULL) {
			_LOG_ERR_("%s\n",
				"[CONTROLLER] FATAL ERROR in function key_authentication");
			raise(SIGTERM);
			break;
		}

#ifdef DEBUG
		char *out = cJSON_Print(auth_resp);
		debug_print("%s\n", out);
		free(out);
#endif
		
		authenticated = cJSON_GetObjectItem(auth_resp,"authenticated")->type;
		//display job at lcd display
		if (authenticated || cJSON_GetObjectItem(auth_resp, "error_code")->valueint == 200) {
			cJSON *job_to_display = cJSON_GetObjectItem(auth_resp, "job_to_display");
			display_msg(cJSON_GetObjectItem(job_to_display, "time")->valueint,
					cJSON_GetObjectItem(job_to_display, "msg1")->valuestring,
					cJSON_GetObjectItem(job_to_display, "msg2")->valuestring);
		} else {
			//print default msg to display (server error, no connection to server)
			display_msg(TIMEOUT_AFTER_AUTH * 1000,
					default_msg_after_auth1, default_msg_after_auth2);
		}

		for(;;) {

		if (authenticated) {
			if(!cJSON_GetObjectItem(auth_resp, "authorized")->type) {
				_LOG_MSG_("[CONTROLLER] %s\n", "User is not authorized\n");
				sleep(1);
				break;
			}
		} else {
			if (cJSON_GetObjectItem(auth_resp, "error_code")->valueint == 200) {
				// we had a server connection, key could not be authenticated
	                        debug_print("[DEBUG] [CONTROLLER] no user exist with key:[%s]\n", key->key);
	                        _LOG_MSG_("[CONTROLLER] %s\n", "Theres no user associated with the key");
	                        sleep(1);
				break;
			}
			_LOG_MSG_("[CONTROLLER] auth request fail, ERROR_CODE:[\"%d\"]\n[CONTROLLER] Offline modus started\n", cJSON_GetObjectItem(auth_resp, "error_code")->valueint);
		}

		debug_print("[DEBUG] [CONTROLLER] Key: \"%s\" is authorized\n", key->key);
		_LOG_MSG_("[CONTROLLER] User is authorized. Wait %d sec - item pressing\n", TIMEOUT_AFTER_AUTH);			
		//wait here some seconds till a user pressed a button at the cfe-machine
		item_nr = wait_for_item_pressing_on_coffee_machine(cJSON_GetObjectItem(auth_resp, "enabled_products"));

		if (item_nr == NO_ITEM_CHOOSEN) {
			display_msg(timeout_expired_time, timeout_expired_msg1, timeout_expired_msg2);
			_LOG_MSG_("[CONTROLLER] %s\n", "Button on machine was not pressed - TIMEOUT");
			debug_print("[DEBUG] [CONTROLLER] %s\n", "button was not pressed");
			break;
		} else if (item_nr == ITEM_CHOOSEN_BUT_NOT_ENOUGH_CREDIT) {
			display_msg(not_enough_credit_for_item_time, not_enough_credit_for_item_msg1, not_enough_credit_for_item_msg2);
			_LOG_MSG_("[CONTROLLER] %s\n", "Button on machine was pressed - But not enough credit");
			debug_print("[DEBUG] [CONTROLLER] %s\n", "button was pressed, but not enough credit");
			break;
		}

		_LOG_MSG_("[CONTROLLER] User with key: \"%s\", pressed button: [%d]\n", key, item_nr);
		debug_print("[DEBUG] [CONTROLLER] User with key: \"%s\", pressed button: [%d]\n", key->key, item_nr);
				
		//prepare booking request		
		cJSON *booking_req = cJSON_CreateObject();
		if (authenticated) {
			cJSON_AddTrueToObject(booking_req, "authenticated");
	     		cJSON_AddNumberToObject(booking_req, "user_id", cJSON_GetObjectItem(auth_resp, "user_id")->valueint);
		} else {
			cJSON_AddFalseToObject(booking_req, "authenticated");
			cJSON_AddNumberToObject(booking_req, "error_code", cJSON_GetObjectItem(auth_resp, "error_code")->valueint);
		}
		cJSON_AddStringToObject(booking_req, "key", cJSON_GetObjectItem(auth_resp, "key")->valuestring);
		cJSON_AddStringToObject(booking_req, "date", cJSON_GetObjectItem(auth_resp, "date")->valuestring);
		cJSON_AddNumberToObject(booking_req, "item_code", item_nr);
				
#ifdef DEBUG
		char *print = cJSON_Print(booking_req);
		debug_print("[DEBUG CONTROLLER] Send Booking:\n%s\n", print);
		fflush(stdout);
		free(print);
#endif

		char *raw_root_json_str = cJSON_PrintUnformatted(booking_req);
		cJSON_Delete(booking_req);

		//send booking
		booking_resp = push_booking_to_server(raw_root_json_str);
				
		//print msg to lcd display
		if (booking_resp != NULL) {
			display_msg(cJSON_GetObjectItem(booking_resp, "time")->valueint,
				cJSON_GetObjectItem(booking_resp, "msg1")->valuestring,
				cJSON_GetObjectItem(booking_resp, "msg2")->valuestring);
		}
					
		if (booking_resp == NULL || cJSON_GetObjectItem(booking_resp, "error")->type) {
			_LOG_MSG_("[CONTOLLER] Booking was not successfully.\n");
                        debug_print("[CONTOLLER] %s\n", "Booking was not successfully.");
                        ret = write_in_backup_file(raw_root_json_str);
                        if (ret) {
                    	    debug_print("%s\n", "[DEBUG] [CONTROLLER] write in backup file was succ");
                            _LOG_MSG_("[CONTOLLER] booking was successfully written in backup file\n");
                        } else {
                            _LOG_ERR_("[CONTROLLER] Error: cant write in backup_file: %s\n", raw_root_json_str);
                            debug_print("[DEBUG] [CONTROLLER] %s\n","Error: cant write in backup_file");
                        }

                        if (booking_resp == NULL) {
				debug_print("[DEBUG] [CONTROLLER] %s\n", "Fatal error in send booking to server");
                                raise(SIGTERM);
                        }
			
			free(raw_root_json_str);
			cJSON_Delete(booking_resp);
			break;
		}

		debug_print("[DEBUG] [CONTROLLER] %s\n", "Booking successfully completed");
		_LOG_MSG_("[CONTOLLER] Booking successfully completed\n");
	
		if (!start_thread) {
	
			if ((ret = have_unprocessed_bookings()) > 0) {
				start_thread = 1;
			}
#ifdef DEBUG	
			else if (ret == 0) {
				debug_print("%s\n",
					"[DEBUG] [CONTROLLER] backup file is empty, no unprocessed bookings");
			} else {
				debug_print("%s\n",
					"[DEBUG] [CONTROLLER] Error in function have_unprocessed_bookings");
			}
#endif

			if (start_thread) {
				//Catch up unproceed bookings
				if (pthread_create(&th_proceed_unproceed_bookings,
					NULL, th_proceed_unprocessed_bookings, &start_thread)
					!= 0) {
					_LOG_ERR_("[CONTROLLER] %s\n",
						"Error in function pthread_create() \"proceed unproceed bookings\"\n");
					} else {
						pthread_detach(th_proceed_unproceed_bookings);
						debug_print("[DEBUG] %s\n","proceed unprocessed bookings thread created");
					}
			}
		} else {
			debug_print("%s\n", "thread already exists");
			_LOG_MSG_("[CONTROLLER] Cant start thread to proceed unprocesed bookings, because thread alreay exists!\n");
		} 
				
		free(raw_root_json_str);
		cJSON_Delete(booking_resp);	
		break;		
		} //end for (;;)

		cJSON_Delete(auth_resp);

		memset(key->key, '\0', MAX_KEY_LENGTH);
		ret = pthread_mutex_unlock(&key->mutex);
		if (ret != 0) {
			_LOG_ERR_("[CONTROLLER] %s\n", "Cant unlock key mutex in main_loop!");
		}

	}

	//end while(main_loop)
	return 0;
}
