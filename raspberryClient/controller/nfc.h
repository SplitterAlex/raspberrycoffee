/*
 * nfc.h
 *
 * Created on: April 28, 2015
 *	Author: alex
 */

#ifndef NFC_H_
#define NFC_H_

#include <stdio.h>
#include <stdlib.h>
#include <sys/wait.h>
#include <nfc/nfc.h>
#include <pthread.h>
#include <string.h>
#include <signal.h>
#include <unistd.h>

#include "debug.h"
#include "log.h"
#include "config.h"



typedef struct {
	char key[MAX_KEY_LENGTH];
	pthread_mutex_t mutex;
	pthread_cond_t cond;
} KEY;

KEY *key;

extern int th_nfc_loop;

void *th_start_nfc_loop();



#endif /* NFC_H_ */



