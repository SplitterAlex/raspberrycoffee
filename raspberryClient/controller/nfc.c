

#include "nfc.h"


void *th_start_nfc_loop() {

        nfc_device *pnd;
        nfc_target nt; 

        int len, i, ret;
        char buf[16];
        char key_buf[MAX_KEY_LENGTH];
        size_t szPos;
	
	key = malloc(sizeof (KEY));
	if (key == NULL) {
		_LOG_ERR_("[TH_NFC] %s\n", "can't allocate memory for struct key");
		raise(SIGTERM);
		return (int *) 0;
	}
	pthread_mutex_init(&key->mutex, NULL);
	pthread_cond_init(&key->cond, NULL);


        // allocate only a pointer to nfc_context
        nfc_context *context;

        //Initialize libnfc and set the nfc_context
        nfc_init(&context);
        if (context == NULL) {
                _LOG_ERR_("Unable to init libnfc (malloc)\n");
                raise(SIGTERM);
                return 0; 
        }
    
        _LOG_MSG_("[TH_NFC] libnfc version: %s\n", nfc_version());

        // Open, using the first available NFC device which can be in order of selection:
        //   - default device specified using environment variable or
        //   - first specified device in libnfc.conf (/etc/nfc) or
        //   - first specified device in device-configuration directory (/etc/nfc/devices.d) or
        //   - first auto-detected (if feature is not disabled in libnfc.conf) device
        pnd = nfc_open(context, NULL);

        if (pnd == NULL) {
                _LOG_ERR_("[TH_NFC] %s\n", "Unable to open NFC device.");
		raise(SIGTERM);
                return 0;
        }
        // Set opened NFC device to initiator mode
        if (nfc_initiator_init(pnd) < 0) { 
                nfc_perror(pnd, "nfc_initiator_init");
                _LOG_ERR_("[TH_NFC] %s\n", "error at nfc_initiator_init");
		raise(SIGTERM);
                return 0;
        }
    
        _LOG_MSG_("[TH_NFC] reader: %s opened\n", nfc_device_get_name(pnd));
        debug_print("[TH_NFC] reader: %s opened\n", nfc_device_get_name(pnd));

        const nfc_modulation nmMifare = {
                .nmt = NMT_ISO14443A,
                .nbr = NBR_106,
        };
	
        while (th_nfc_loop) {
		memset(key_buf, '\0', MAX_KEY_LENGTH);
                sleep(1);
                len = 0;
	        ret = nfc_initiator_select_passive_target(pnd, nmMifare, NULL, 0, &nt);

                if (ret > 0) {
                        for (szPos = 0; szPos < nt.nti.nai.szUidLen; szPos++) {
                                i = snprintf(buf, sizeof buf, "%02x", nt.nti.nai.abtUid[szPos]);
                                len += i;
                                if (len >= MAX_KEY_LENGTH) {
                                        _LOG_ERR_("[TH_NFC] readed key is too long\n");
                                        continue;
                                }

                                if (!szPos) {
                                        strncpy(key_buf, buf, len);
                                } else {
                                        strncat(key_buf, buf, len);
                                }
                        }

                        _LOG_MSG_("[TH_NFC] key read: %s\n", key_buf);

                        /*
                         * if the mutex is unlocked, the key get pass to the controller loop
                         *
                         * If the mutex is locked, discard the key we already read and wait for a next
                         * key we can read.
                         */
                        ret = pthread_mutex_trylock(&key->mutex);
                        if (ret != 0) {
                                debug_print("%s\n",
                                        "[DEBUG] [TH_NFC] mutex is already locked, continue");
                                //TODO print ein schlüssel wird bereits verwendet? er soll warten oder drücken
				continue;
                        }

                        /* critical range */
                        strncpy(key->key, key_buf, MAX_KEY_LENGTH);

                        if (pthread_mutex_unlock(&key->mutex) != 0) {
                                _LOG_ERR_("[TH_NFC] %s\n",
                                        "cant unlock key_mutex in scanner thread!");
                        }

                        pthread_cond_signal(&key->cond);
                } else {
                        _LOG_ERR_("[TH_NFC] %s\n", "Error at nfc reader, try to restart nfc reader");
                        nfc_close(pnd);
                        nfc_exit(context);

	       		//Initialize libnfc ans set the nfc_context
       			nfc_init(&context);
       			if (context == NULL) {
                		_LOG_ERR_("Unable to init libnfc (malloc)\n");
                		raise(SIGTERM);
                		return 0;
        		}

        		pnd = nfc_open(context, NULL);

	        	if (pnd == NULL) {
        	        	_LOG_ERR_("[TH_NFC] %s\n", "Unable to open NFC device.");
                		raise(SIGTERM);
                		return 0;
     			}
        		// Set opened NFC device to initiator mode
        		if (nfc_initiator_init(pnd) < 0) { 
                		nfc_perror(pnd, "nfc_initiator_init");
	                	_LOG_ERR_("[TH_NFC] %s\n", "error at nfc_initiator_init");
        	        	raise(SIGTERM);
                		return 0;
        		}

        		_LOG_MSG_("[TH_NFC] reader: %s opened\n", nfc_device_get_name(pnd));
        		debug_print("[TH_NFC] reader: %s opened\n", nfc_device_get_name(pnd));
                }
        }

        nfc_close(pnd);
        nfc_exit(context);
        debug_print("[DEBUG] [TH_NFC] %s\n", "nfc thread exit");
        pthread_exit((int *) 1);
}

