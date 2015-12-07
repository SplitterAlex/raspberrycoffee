/*
 * mci.h
 *
 *  Created on: Jan 23, 2015
 *      Author: alex
 */

#ifndef MCI_H_
#define MCI_H_

#include <sys/types.h>
#include <sys/select.h>
#include <sys/stat.h>

#include <stdlib.h>
#include <stdio.h>
#include <unistd.h>
#include <fcntl.h>
#include <termios.h>
#include <time.h>
#include <string.h> // needed for memset
#include <signal.h>
#include <errno.h>
#include <pthread.h>

#include "debug.h"
#include "log.h"
#include "cJSON.h"
#include "config.h"

// needed for backlight flashing,
// when a user pressed a button,
// but there was no authentication
#include "display.h"


typedef char m_byte;


#define MAX_REQUEST_LEN 16

#define ACK		0x06
#define NACK		0x15
#define STX		0x02
#define ETX		0x03
#define ETB		0x17

#define X_LEN 14
#define S_LEN 9
#define I_LEN 7

#define X_RESPONSE_1 m_byte x_response[X_LEN+1] = { STX, 'X', '1', '0', '0', '1', '1', '3', '0', '1', ETX, '5', '8', ETB, '\0' }
#define S_RESPONSE_1 m_byte s_response1[S_LEN+1] = { STX, 'S', '1', if_stat, to_ps, ETX, '6', '1',ETB, '\0' };
#define S_RESPONSE_2 m_byte s_response2[S_LEN+1] = { STX, 'S', '0', if_stat, to_ps, ETX, '6', '0', ETB, '\0' };
#define I_RESPONSE_1 m_byte i_response1[I_LEN+1] = { STX, 'I', '0', ETX, '7', 'A', ETB, '\0' };
#define I_RESPONSE_2 m_byte i_response2[I_LEN+1] = { STX, 'I', '1', ETX, '7', 'B', ETB, '\0' };



#define MAX_RESPONSE_CMDS 5



enum RESPONSE_MSGS {
	X_RESPONSE,
	S_RESPONSE_ACTION,
	S_RESPONSE_NO_ACTION,
	I_RESPONSE_CREDIT_LOW,
	I_RESPONSE_CREDIT_HIGH
};

enum CREDITS {
	NO_CREDIT_AVAILABLE = 0,
	CREDIT_AVAILABLE = 1
};

enum ITEMS {
	ESPRESSO = 5,
	COFFEE = 1,
	ESPRESSO_GRANDE = 6,
	COFFEE_GRANDE = 2,
	CAPPUCCINO = 9,
	LATTE = 8,
	HOT_MILK = 10,
	HOT_WATER = 11,
};

#define NO_ITEM_CHOOSEN -1
#define ITEM_CHOOSEN_BUT_NOT_ENOUGH_CREDIT -2


static const int response_cmds_lengths[MAX_RESPONSE_CMDS] = { X_LEN, S_LEN, S_LEN, I_LEN, I_LEN };

typedef struct {
	int credits_available;
	int offline_modus;
	cJSON *enabled_products; 
	/* -1 (NO_ITEM_CHOOSEN) -> no button was pressed yet
	 * -2 (ITEM_CHOOSEN_BUT_ ... ) -> a button was pressed, but not enough credit
	 * >= 0 -> a Button was pressed */
	int selected_product;
	pthread_mutex_t mutex;
} SHARED_DATA;

SHARED_DATA *sdata;

extern int th_mci_loop;

int init_mini_coffee_interface();
void *th_start_mci_loop();



#endif /* MCI_H_ */
