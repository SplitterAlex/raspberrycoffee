/*
 * Controller.h
 *
 *  Created on: Jan 7, 2015
 *      Author: alex
 */

#ifndef CONTROLLER_H_
#define CONTROLLER_H_



#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/ipc.h>
#include <sys/wait.h>
#include <fcntl.h>
#include <errno.h>
#include <string.h>
#include <signal.h>
#include <ctype.h>
#include <pthread.h>


#include "mci.h"
#include "nfc.h"
#include "cJSON.h"
#include "network.h"
#include "read_write_backup_file.h"
#include "debug.h"
#include "display.h"
#include "config.h"
#include "default_messages.h"
//#include "log.h"


#define BUF_SCANNER_MAX 256

#define MAX_TOKEN_BUF_SIZE 512

#define INT_LEN 15


void sig_usr(int sig_nr);
int start_controller();


#endif /* CONTROLLER_H_ */
