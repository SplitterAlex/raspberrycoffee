
#ifndef DISPLAY_H_
#define DISPLAY_H_

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>

#include <unistd.h>
#include <string.h>
#include <time.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <errno.h>
#include <signal.h>

#include <wiringPi.h>
#include <lcd.h>

#include "debug.h"
#include "log.h"
#include "config.h"
#include "default_messages.h"

#include <pthread.h>


// wiringPi pin numbers
// "www.projects.drogon.net/raspberry-pi/wiringpi/pins/"
#define DB4	 0
#define DB5	 1
#define DB6	 2
#define DB7	 3
#define RS	11
#define E	10

#define LIGHT 14

#define COLS 16
#define ROWS 2
#define BIT_MODE 4

#define MAX_MSG_LEN 512

enum priority {
	ERROR = 0, NO_ERROR = 1
};

struct display_msg_sdata {
	int newMsg;
	int duration;
	char msg1[MAX_MSG_LEN];
	char msg2[MAX_MSG_LEN];
	pthread_mutex_t mutex;
};

struct display_msg_sdata *dmd;

extern int th_display_loop;

void display_msg(int duration, char *msg1, char *msg2);
void *th_start_display(void * arg);
void set_backlight_flashing();


#endif /* DISPLAY_H_  */

