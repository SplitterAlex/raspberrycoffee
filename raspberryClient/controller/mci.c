/*
 * mci.c
 *
 *  Created on: Jan 23, 2015
 *      Author: alex
 */

/*
 ============================================================================
 Name        : mci.c
 Author      : Alexander
 Version     :
 Copyright   :
 Description :
 ============================================================================
 */

#include "mci.h"

static m_byte **response_cmds; //holds all possible response commands.

static struct termios tio;
static int tty_fd;

static const m_byte hex_chars[] = "0123456789ABCDEF";

//two request inquirys in a row are not allowed, for more details take a look
//in the CSI Manual at: Kapitel 3.5 Page 19
static int last_command_was_inquiry = 0;


/*
 * Function: is_int
 * ----------------------------
 *   This function checks if a char array contains
 *   a valid integer
 *
 *   char *arg	 : holds the char digits
 *
 *   returns:
 *   return a valid integer which is transfromed
 *   from a char array, otherwise -1
 */
static int is_int(char *arg) {

	long val;
	char *stop_ptr = NULL;

	val = strtol(arg, &stop_ptr, 10);
	if (errno == ERANGE) {
		return -1;
	}
	if (!val) {
		return -1;
	}
	if (strlen(arg) > 9) {
		return -1;
	}
	if (*stop_ptr) {
		return -1;
	} else
	return (int) val;
}

/*
 * Function: validate_cmd
 * ----------------------------
 *
 *   calculate and check checksum from request
 *   For more details take a look in the manual:
 *   "CCI/CSI-Protokoll" - "Schnittstellen Norm für Ausschank
 *   anlagen und Kreditsysteme"
 *   Kapitel 3.4 - Checksumme
 *
 *   returns: return 1 if cmd is valid, otherwise 0.
 */
static int validate_cmd(m_byte *cmd_request, int length) {

	m_byte bcc = 0x00;

	// start with 1 because STX is not included in checksum
	int i;
	for (i = 1; i <= (length - 3); i++) {
		bcc = bcc ^ cmd_request[i];
	}

	if ((cmd_request[length - 2] != hex_chars[(bcc >> 4) & 0x0F])
			|| (cmd_request[length - 1] != hex_chars[bcc & 0x0F])) {
		return 0;
	}

	return 1;
}

/*
 * Function: open_and_configure_tty
 * ----------------------------
 *   This function open the device (Mini-coffee-interface).
 *   Set the BAUDRATE speed to 9600 and set the termios
 *   configuration to the device file descriptor
 *
 *   returns: return 1 if no error occured, otherwise -1.
 */
static int open_and_configure_tty() {
	if ((tty_fd = open(MCI_DEVICE_PATH, O_RDWR)) < 0) {
		_LOG_ERR_(
				"[MCI] cant open mini coffe interface. error in open(). Device path: %s\n",
				MCI_DEVICE_PATH);
		if (errno == ENOENT) {
			debug_print("[DEBUG] [MCI] %s\n",
					"device not found");
			if ((tty_fd = open("/dev/ttyUSB1", O_RDWR)) < 0) {
				_LOG_ERR_(
						"[MCI] cant open mini coffe interface. error in open(). Device path: %s\n",
						"/dev/ttyUSB1");
				perror("[MCI] ");
				return -1;
			}
		} else {
			perror("[MCI] ");
			return -1;
		}
	}

	if (((cfsetospeed(&tio, B9600)) < 0) || (cfsetispeed(&tio, B9600) < 0)) { //9600 BAUD
		_LOG_ERR_("[MCI] %s\n", "cant set BAUD Speed. error in cfsetispeed()");
		perror("[MCI] ");
		return -1;
	}

	if ((tcsetattr(tty_fd, TCSANOW, &tio)) < 0) {
		_LOG_ERR_("[MCI] %s\n", "error in tcsetattr");
		perror("[MCI] ");
		return -1;
	}

	return 1;
}

/*
 * Function: init_mini_coffee_interface
 * ----------------------------
 *   initialized all needed cmds, open the device and configure
 *   the tty/termios settings
 *
 *   return 1 if no error occurs, otherwise -1
 */
int init_mini_coffee_interface() {

	m_byte if_stat = 0;
	m_byte to_ps = 0;

	X_RESPONSE_1;
	S_RESPONSE_1;
	S_RESPONSE_2;
	I_RESPONSE_1;
	I_RESPONSE_2;

	response_cmds = malloc(sizeof(m_byte *) * MAX_RESPONSE_CMDS);
	if (response_cmds != NULL) {
		response_cmds[X_RESPONSE] = malloc(sizeof(m_byte *) * (X_LEN + 1));
		response_cmds[S_RESPONSE_ACTION] = malloc(
				sizeof(m_byte *) * (S_LEN + 1));
		response_cmds[S_RESPONSE_NO_ACTION] = malloc(
				sizeof(m_byte *) * (S_LEN + 1));
		response_cmds[I_RESPONSE_CREDIT_LOW] = malloc(
				sizeof(m_byte *) * (I_LEN + 1));
		response_cmds[I_RESPONSE_CREDIT_HIGH] = malloc(
				sizeof(m_byte *) * (I_LEN + 1));
		int i;
		for (i = 0; i < MAX_RESPONSE_CMDS; i++) {
			if (response_cmds[i] == NULL) {
				_LOG_ERR_("[MCI] %s\n",
						"can't allocate memory for response commands");
				return -1;
			}
		}
	} else {
		_LOG_ERR_("[MCI] %s\n", "can't allocate memory for response commands");
		return -1;
	}

	memmove(response_cmds[X_RESPONSE], x_response, X_LEN + 1);
	memmove(response_cmds[S_RESPONSE_ACTION], s_response1, S_LEN + 1);
	memmove(response_cmds[S_RESPONSE_NO_ACTION], s_response2, S_LEN + 1);
	memmove(response_cmds[I_RESPONSE_CREDIT_LOW], i_response1, I_LEN + 1);
	memmove(response_cmds[I_RESPONSE_CREDIT_HIGH], i_response2, I_LEN + 1);

	if ((memset(&tio, 0, sizeof(tio))) < 0) {
		_LOG_ERR_("[MCI] %s\n", "error in memset() tio");
		perror("[MCI] ");
		return -1;
	}

	tio.c_iflag = 0;
	tio.c_oflag = 0;
	tio.c_cflag = CS8 | CREAD | CLOCAL; // 8n1, see man page for more information
	tio.c_cflag &= ~CSTOPB;
	tio.c_cflag &= ~(PARENB | PARODD); // disable parity bit
	tio.c_lflag = 0;
	tio.c_cc[VMIN] = MAX_REQUEST_LEN;
	tio.c_cc[VTIME] = 1;

	if (open_and_configure_tty() == -1) {
		return -1;
	}

	sdata = malloc(sizeof(SHARED_DATA));
	if (sdata == NULL) {
		_LOG_ERR_("[MCI] %s\n", "can't allocate memory for shared data");
		return -1;
	}

	pthread_mutex_init(&sdata->mutex, NULL);
	sdata->credits_available = 0;
	sdata->offline_modus = 0;
	sdata->selected_product = NO_ITEM_CHOOSEN;
	sdata->enabled_products = NULL;

	return 1;
}

/*
 * Function: check_credit
 * ----------------------------
 *   if the request command is valid (checksum) and is an Inquiry, this function
 *   take a look if enough credits for this product are available or not.
 *
 *   int product_id: unique id of the pressed button/product -> mci.h
 *
 *   return	0 if no credit was applied/available
 *		1 if credit was applied/available
 */
static int check_credit(int product_id) {
                
        debug_print("[DEBUG] [MCI] start check_credit() - product_id: %d\n", product_id);
	
	pthread_mutex_lock(&sdata->mutex);
	
	//Hot water don't need a authentication, but if a costumer was so friendly
	//to authenticate, a booking request will be send to the server.
	if (product_id == HOT_WATER && !sdata->credits_available) {
		_LOG_MSG_("[MCI] Anonymous activation of hot water\n");
		pthread_mutex_unlock(&sdata->mutex);
		return 1;
	}

	if (!sdata->credits_available) {
		debug_print("[DEBUG] [MCI] %s\n", "no credits available");
		pthread_mutex_unlock(&sdata->mutex);
		set_backlight_flashing();
		return 0;
	}

	//offline modus
	if (sdata->offline_modus) {
		//apply inquiry
		sdata->selected_product = product_id;
		sdata->credits_available = NO_CREDIT_AVAILABLE;
		pthread_mutex_unlock(&sdata->mutex);
		return 1;
	}
        
	int arr_size = cJSON_GetArraySize(sdata->enabled_products);
	int i;
	for (i = 0; i < arr_size; i++) {
		cJSON *item = cJSON_GetArrayItem(sdata->enabled_products, i);
		if (item == NULL) {
			_LOG_ERR_("[MCI] Item from CJSON_GetArrayItem(enabled_products, %d) is NULL\n", i);
			pthread_mutex_unlock(&sdata->mutex);
			return 0;
		}

		if (cJSON_GetObjectItem(item, "id")->valueint != product_id) {
			continue;
		}
		int ret;
		if (cJSON_GetObjectItem(item, "is_Enabled")->type) {
			debug_print("[DEBUG] [MCI] product with id '%d' successfully applied\n", product_id);
			sdata->selected_product = product_id;
			ret = 1;
		} else {
			sdata->selected_product = ITEM_CHOOSEN_BUT_NOT_ENOUGH_CREDIT;
			ret = 0;
		}
		sdata->credits_available = NO_CREDIT_AVAILABLE;
		pthread_mutex_unlock(&sdata->mutex);
		return ret;
	}

	_LOG_ERR_("[MCI] doesnt find a match in enabled_products with product_id: %d. mci.c line 280\n", product_id);
	pthread_mutex_unlock(&sdata->mutex);
	return 0;
}

/*
 * Function: handle_request
 * ----------------------------
 *   if the request command is valid (checksum), this function handle the
 *   request, checks which command is received and pick the appropriate
 *   response cmd number and return it.
 *
 *   char *cmd_request: valid request command
 *
 *   return the id of the response command, which get send. (enum RESPONSE_MSGS)
 */
static int handle_request(m_byte *cmd_request) {
	m_byte cmd_type = cmd_request[1];
	int response_msg_nr = -1;

	switch (cmd_type) {

	/*
	 * X -> Identification
	 * {
	 * 	1	STX 		: 0x02
	 * 	2	'X' 		: Command Type
	 * 	3	'1' 		: 1 stands for CSI (LEVEL 1)
	 * 	4	'0' 		: [BYTE: 4-5]Paymentsystem -> only in use with CCI -> '0''0'
	 * 	5	'0' 		: [BYTE: 4-5]
	 * 	6   '1' 		: [BYTE: 6-8] Interface SW-Version -> our software version is 1.1.3 -> '1''1''3'
	 * 	7   '1' 		:
	 * 	8   '3' 		:
	 * 	9   '0' 		: [BYTE: 9-10] Functionality level -> we only use LEVEL 1! -> '0''1'
	 * 	10  '1' 		:
	 * 	11  ETX 		: 0x03
	 * 	12  '5' 		: [BYTE: 12-13] CHECKSUM -> '5''8'
	 * 	13  '8' 		:
	 * 	14  ETB			: 0x17
	 * }
	 */
	case 'X':
		;
                debug_print("[DEBUG] [MCI] Identification cmd received: \"%s\"\n", cmd_request);
		//write(tty_fd, response_cmds[X_RESPONSE], X_LEN);
		response_msg_nr = X_RESPONSE;
		break;

		/*
		 * S -> Status
		 * {
		 *  1	STX 		: 0x02
		 *  2	'S'			: Command Type
		 *  3   '0'|'1' 	: '0' -> No Action: No Chip was detected, or Chip was detected, but User havent enough Credit
		 *  				  '1' -> ready: Chip was detected, and User have enough Credit
		 *  4	IF_STAT		: different STATS. See Manual
		 *  5	TO_PS		: Timeout_Payment-System. See Manual
		 *  6	ETX			: 0x03
		 *  7	'6'			: [BYTE: 7-8] CHECKSUM -> '6'('0'|'1')
		 *  8	'0'|'1'		:
		 *  9	ETB			: 0x17
		 * }
		 */
	case 'S':
		;
		last_command_was_inquiry = 0;
		pthread_mutex_lock(&sdata->mutex);
		if (sdata->credits_available) {
			response_msg_nr = S_RESPONSE_ACTION;
		} else {
			response_msg_nr = S_RESPONSE_NO_ACTION;
		}
		pthread_mutex_unlock(&sdata->mutex);
		break;

		/*
		 * V -> Vend
		 * Only in use with CCI. We dont have to impl this CMD
		 */
	case 'V':

		break;

		/*
		 * I -> Inquiry (Verkaufsanfrage)
		 * {
		 *  1	STX			: 0x02
		 *  2	'I'			: Command Type
		 *  3	'0'|'1'		: '0' -> Credit is to low
		 *  				: '1' -> User have enough Credit
		 *  4	ETX			: 0x03
		 *  5	'7'			: [BYTE: 5-6] CHECKSUM -> '7'('A'|'B');
		 *  6	'A'|'B'		:
		 *  7	ETB			: 0x17
		 * }
		 *
		 * Possible Request:
		 *
		 * STX, 'I', '0', '0', '5', '1', ETX, '4', 'E', 'ETB' -> expresso
		 * STX, 'I', '0', '0', '1', '1', ETX, '4', 'D', 'ETB' -> coffee
		 * STX, 'I', '0', '0', '6', '1', ETX, '4', 'A', 'ETB' -> 2 * expresso
		 * STX, 'I', '0', '0', '2', '1', ETX, '4', '9', 'ETB' -> 2 * coffee
		 * STX, 'I', '0', '0', '9', '1', ETX, '4', '2', 'ETB' -> cappuccino
		 * STX, 'I', '0', '0', '8', '1', ETX, '4', '3', 'ETB' -> latte
		 * STX, 'I', '0', '1', '0', '1', ETX, '4', 'A', 'ETB' -> milk, milk portion
		 * STX, 'I', '0', '1', '1', '1', ETX, '4', 'B', 'ETB' -> hot water, hot water portion
		 *
		 * Product id's
		 *
		 * 0011 -> Coffee
		 * 0021 -> 2xCoffee
		 * 0051 -> Expresso
		 * 0061 -> 2xExpresso
		 * 0081 -> Latte
		 * 0091 -> Cappuccino
		 *
		 * 0101 -> Milk, Milk Portion
		 * 0111 -> Hot Water, Hot Water Portion
		 *
		 */
	case 'I':
		;
		/*
		 * Damit keine Mehrfachabbuchungen bei Nichtverstehen der
		 * Antwort auf Inquiry vorkommen können, muss auf ein Inquiry
		 * Kommando stets ein Status folgen. Das Interface interpretiert
		 * dies als Quittung auf die Antwort Kredit Okay.
		 * Wenn das Interface nach einem Inquiry ein status schickt,
		 * hat das Interface alles verstanden.
		 */
		_LOG_MSG_("[MCI] Button was pressed - Inquiry - with product id: \"%c%c%c\"\n", cmd_request[2],cmd_request[3],cmd_request[4]);
                                debug_print("[DEBUG] [MCI] Inquiry cmd received: \"%s\"\n", cmd_request);
		debug_print("[MCI] Button was pressed - Inquiry - with product id: \"%c%c%c\"\n", cmd_request[2],cmd_request[3],cmd_request[4]);
		if (last_command_was_inquiry) {
			_LOG_MSG_("[MCI] %s\n", "Last Command was an inquiry!");
			_LOG_ERR_("[MCI] %s %d\n", "Last Command was an inquiry!", last_command_was_inquiry);
			if (last_command_was_inquiry == 1) {
				response_msg_nr = I_RESPONSE_CREDIT_HIGH;
			} else {
				response_msg_nr = I_RESPONSE_CREDIT_LOW;
			}
		} else {
			m_byte product_id[4];
			strncpy(product_id, cmd_request+2, 3);
			product_id[3] = '\0';
			if (check_credit(is_int(product_id))) {
				response_msg_nr = I_RESPONSE_CREDIT_HIGH;
				last_command_was_inquiry = 1;
			} else {
				response_msg_nr = I_RESPONSE_CREDIT_LOW;
				last_command_was_inquiry = 2;
			}
		}
		break;
	default:
		_LOG_ERR_(
				"[MCI] reached default case in handle_request. cmd '%s' is not implemented\n",
				cmd_request);
		break;
	}

	return response_msg_nr;

}

/*
 * Function: th_start_mci_loop
 * ----------------------------
 *
 * Starts the infinite loop and reads periodically from the
 * mini_coffee_interface
 *
 * Commands from the Mini_coffee_interface reached every 0.7
 * seconds. If not we have to assume the mci is unplugged,
 * because the power for the mci comes from the cfe-machine,
 * and so no cmds can read.
 *
 */
void *th_start_mci_loop() {

	int res, bytes_read, response_msg_nr, unpluggedIsDetected = 0;

	fd_set rdset, master;
	struct timeval tv, tv1;

	m_byte cmd_request[MAX_REQUEST_LEN];

	m_byte ack = ACK;
	m_byte nack = NACK;

	FD_ZERO(&rdset);
	FD_ZERO(&master);
	FD_SET(tty_fd, &rdset);
	FD_SET(tty_fd, &master);

	//timeout, if we dont get a request within one seconds, the mci has no power/or is unplugged!
	tv.tv_sec = 1;
	tv.tv_usec = 0;

	while (th_mci_loop) {

		//reset timeout
		memcpy(&tv1, &tv, sizeof(tv));
		rdset = master;

		res = select(tty_fd + 1, &rdset, NULL, NULL, &tv1);

		if (res > 0) {

			if (unpluggedIsDetected) {
				_LOG_ERR_("[MCI] Mini coffee interface is plugged in\n");
				debug_print("[DEBUG] [MCI] %s\n", "interface is plugged in");
				unpluggedIsDetected = 0;
				raise(SIGUSR1);
			}

			if (FD_ISSET(tty_fd, &rdset)) {

				bytes_read = read(tty_fd, cmd_request, MAX_REQUEST_LEN);

				if (bytes_read > 0) {
//                    	request.cmd_length = bytes_read-1;

					if (validate_cmd(cmd_request, bytes_read - 1)) {
						//send ACK
						write(tty_fd, &ack, 1);

						//debug_print("[DEBUG] [MCI] REQ ACK: %s %d\n", cmd_request, bytes_read);

						response_msg_nr = handle_request(cmd_request);
						if (response_msg_nr >= 0) {      
#ifdef DEBUG
                                                	if (response_msg_nr != S_RESPONSE_NO_ACTION && response_msg_nr != S_RESPONSE_ACTION) {
                                                		debug_print("[DEBUG] [MCI] send response \"%s\"\n", response_cmds[response_msg_nr]);
                                                	}                                                               
#endif

							if (write(tty_fd, response_cmds[response_msg_nr],response_cmds_lengths[response_msg_nr]) == -1) {
								_LOG_ERR_("[MCI] %s\n","error in function write() ");
								perror("[MCI] ");
							}
						}

					} else {
						//send NACK
						write(tty_fd, &nack, 1);
						debug_print("[DEBUG] [MCI] checksum failure. cmd: %s\n", cmd_request);
					}
				} else {
					_LOG_ERR_("[MCI] %s\n",
							"error in read() from tty_fd, try to reopen device -> check if Interface is plugged in?");
					perror("[MCI] ");
					close(tty_fd);
					raise(SIGUSR1);

					while (open_and_configure_tty() == -1) {
						if (th_mci_loop == 0) {
							break;
						}
						sleep(1);
					}
					if (th_mci_loop != 0) {
						_LOG_ERR_("[MCI] %s\n",
								"Reconnecting with Mini Coffee Interface was successfully");
						raise(SIGUSR1);
					}
				}
				memset(cmd_request, '\0', MAX_REQUEST_LEN);
			} else {
				debug_print("[DEBUG] [MCI] %s\n", "rd is not set");
			}
		} else if (res < 0) {
			//try reconnecting
			_LOG_ERR_("[MCI] %s\n", "Error on select (), try reconnecting with Mini Coffe Interface...\n");
			close(tty_fd);
			if (open_and_configure_tty() == -1) {
				_LOG_ERR_("[MCI] %s\n",
						"fatal error: cant reconnect with Mini Coffee Interface... restart...");
				perror("[MCI] ");
				raise(SIGTERM);
				return (int*) -1;
			}
		} else if (res == 0) {
			if (!unpluggedIsDetected) {
				_LOG_ERR_("[MCI] Mini Coffee interface is unplugged!\n");
				unpluggedIsDetected = 1;
				raise(SIGUSR1);
			}
			debug_print("[DEBUG] [MCI] %s\n", "interface is unplugged");
		}
	}

	close(tty_fd);
	_LOG_MSG_("[MCI] %s\n", "thread quit GRACEFULLY!");

	return EXIT_SUCCESS;
}

