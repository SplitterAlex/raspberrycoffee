/*
 * main.c
 *
 *  Created on: Jan 8, 2015
 *      Author: alex
 *
 *   open, read and parse the config file and distribute all
 *   the necessary data through the process.
 *
 *   Initialize the logs -> Stderr and log
 *
 *   Starts the startup, initialize the mini-coffee-interface, starts
 *   three threads - one for the communication between the NFC-
 *   reader and the controller, the second for the comm-
 *   unication/handling between the mini-coffee-interface and
 *   the controller, and the third one for the lcd-display.
 *
 *   If the start up was successfully the controller_loop starts
 *
 */

#include "controller.h"


/*
 * Function: init_signalmask
 * ----------------------------
 *   initialized system signals:
 *
 *   SIGUSR1:
 *   Is send from the Mini_coffee_interface thread,
 *   when an error occured e.g. MCI is unplugged.
 *
 *   SIGINT, SIGTERM:
 *   Get catched to enable a gracefully shutdown.
 *
 *   returns: return 1 if no error occured, otherwise -1.
 */
static int init_signalmask(struct sigaction *sig) {

	sigemptyset(&(*sig).sa_mask);
	(*sig).sa_flags = 0;
	(*sig).sa_handler = sig_usr;

	if ((sigaction(SIGUSR1, sig, NULL) == -1)
			|| (sigaction(SIGINT, sig, NULL) == -1)
			|| (sigaction(SIGTERM, sig, NULL) == -1)) {
		return -1;
	}
	return 1;
}


/*
 * Function: startup
 * ----------------------------
 *   After the config file was readed successfully, the startup
 *   begins.
 *
 *   init_mini_coffee_interface:
 *   open MCI-device, set configurations and initialized all cmd
 *   we need to communicate with the Interface
 *
 *   pthread_create(NFC):
 *   Starts a thread which manage the arriving keys from the NFC-
 *   reader.
 *
 *   pthread_create(MCI):
 *   Starts a thread which handle the communication between the
 *   Interface and the controller.
 *
 *   pthread_create(DISPLAY)
 *
 *   init_signalmask:
 *   Initialize Signals such as SIGUSR1, SIGUSR2, SIGINT, SIGTERM
 *
 *   returns: returns -1 if an error occured, otherwise 0
 */
static int startup(pthread_t *th_nfc,
		pthread_t *th_mci, pthread_t *th_display, struct sigaction *sig) {


	if (init_mini_coffee_interface() == -1) {
		_LOG_ERR_("[MAIN] %s\n", "[MCI] init_terminal fails");
		return -1;
	}

	if (pthread_create(th_nfc, NULL, th_start_nfc_loop, NULL) != 0) {
		_LOG_ERR_("[MAIN] %s\n", "can't start th_nfc thread! ");
		return -1;
	}

	if (pthread_create(th_mci, NULL, th_start_mci_loop, NULL) != 0) {
		_LOG_ERR_("[MAIN] %s\n", "can't start th_mci thread! ");
		return -1;
	}

	if (pthread_create(th_display, NULL, th_start_display, NULL) != 0) {
		_LOG_ERR_("[MAIN] %s\n", "can't start th_display thread!");
		return -1;
	}

	if (init_signalmask(sig) == -1) {
		_LOG_ERR_("[MAIN] %s\n",
				"[CONTROLLER] error in sigaction(), Can't add signals");
		return -1;
	}

	return 0;
}

/*
 * Function: main
 * ----------------------------
 *
 *   Initialize the logs -> Stderr and log
 *
 *   Starts the startup, initialize the mini-coffee-interface,
 *   starts three threads - one for the communication between the NFC-
 *   process and the controller, the second for the comm-
 *   unication/handling between the mini-coffee-interface and
 *   the controller and the third one for the lcd display handling
 */
int main(void) {

        char token_puffer[MAX_TOKEN_BUF_SIZE];

	int len;

	struct sigaction sig;

	pthread_t th_nfc;
	pthread_t th_mci;
	pthread_t th_display;

                
        FILE *file = NULL;
        file = fopen(BEARER_TOKEN_PATH, "r");
	if (file == NULL) {
		_LOG_ERR_("[MAIN] can't open/find token file at: %s\n", BEARER_TOKEN_PATH);
		perror("FATAL ERROR: ");
		return EXIT_FAILURE;
	}
                
                
        //fgets(token_puffer, MAX_TOKEN_BUF_SIZE, file);
        if (fgets(token_puffer, MAX_TOKEN_BUF_SIZE, file) == NULL) {
		_LOG_ERR_("[MAIN] token file is empty: %s\n", BEARER_TOKEN_PATH);
		return EXIT_FAILURE;         
	}
	
	int i;
        for(i = 0; i < strlen(token_puffer); i++) {
        	if (token_puffer[i] == '\n') {
                        token_puffer[i] = '\0';
                }
        }
	
	fflush(file);
	fclose(file);
                
        token_puffer[strlen(token_puffer)] = '\0';
                                
	// redirect output of stderr to "err_log_file_path
	if (redirect_stderr_to_log_err() < 0) {
		return EXIT_FAILURE;
	}


	// open the log file
	if (open_log_file() < 0) {
		return EXIT_FAILURE;
	}

                
        //storing bearer token
        len = strlen(token_puffer);
        bearer_token = malloc(sizeof(char *) * (len + 23));
        if((len = snprintf(bearer_token, len +23, "Authorization: Bearer %s", token_puffer)) < 0) {
        	_LOG_ERR_("[MAIN] %s\n", "FATAL ERROR: storing token -> error at snprintf(), cannot store bearer token");
        	return EXIT_FAILURE;
        };
                
        bearer_token[strlen(bearer_token)] = '\0';
        debug_print("%s\n", bearer_token);
        
	_LOG_MSG_("Start up ...\n");

	// startup and initialization - Start the threads
	if (startup(&th_nfc, &th_mci, &th_display, &sig) == -1) {
		_LOG_ERR_("[MAIN] %s\n", "FATAL ERROR IN STARTUP PROGRESS");
		return EXIT_FAILURE;
	}

	_LOG_MSG_("[MAIN] %s\n", "Start up successfull");

	start_controller(); //starts the controller_loop

	/*
	 * The above section of code, can only reached when a shutdown
	 * was indicated
	 */


	debug_print("%s\n", "[DEBUG] EXIT MAIN_LOOP");
	_LOG_MSG_("%s\n", "[MAIN] EXIT MAIN_LOOP");

	//pthread_join(th_nfc, NULL);

	debug_print("%s\n", "[DEBUG] nfc thread have quit");
	_LOG_MSG_("%s\n", "[MAIN] nfc thread have quit");

	pthread_join(th_mci, NULL);

	debug_print("%s\n", "[DEBUG] mci thread have quit");
	_LOG_MSG_("%s\n", "[MAIN] mci thread have quit");

	pthread_join(th_display, NULL);

        debug_print("%s\n", "[DEBUG] display thread have quit");
        _LOG_MSG_("%s\n", "[MAIN] display thread have quit");


	_LOG_MSG_("%s\n", "[MAIN] Gracefully shutdown\n");
	_LOG_ERR_("%s\n", "[MAIN] Gracefully shutdown\n");
	debug_print("%s\n", "[DEBUG] Gracefully shutdown\n");

	close_log_files();

	return EXIT_SUCCESS;
}
