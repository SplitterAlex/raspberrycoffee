/*
 * lcd.c
 * 	29.04.2015
 * Author: Alex
 * 
 * LCD Display. Controller: HD44780
 * Library: wiringPi -> "www.projects.drogon.net/raspberry-pi/wiringpi/lcd-library/"
 * 
 * WIRING 4-Pin mode
 * Name(at Display) : PI (Pin number) : Display (Pin number)
 * RS  : 26 (GPIO7)  : 4
 * E   : 24 (GPIO8)  : 6
 * DB4 : 11 (GPIO17) : 11
 * DB5 : 12 (GPIO18) : 12
 * DB6 : 13 (GPIO27) : 13
 * DB7 : 15 (GPIO22) : 14
 *
 * linking flags: -lwiringPi -lwiringPiDev
 *
 */

#include "display.h"

struct job_details {
	int buf1_pos;
        char buf1[MAX_MSG_LEN + (COLS*2)];
        int buf1_len;
	int buf1_iterations;
	
	int buf2_pos;
        char buf2[MAX_MSG_LEN + (COLS*2)];
        int buf2_len;
	int buf2_iterations;

	int duration;
	int timer;
	
};

struct job_details job_d;

static int enable_backlight_flashing = 0;
static int lcdHandle;

static void initJobDetails () {
	job_d.buf1_pos = 0;
	job_d.buf2_pos = 0;
	job_d.buf1_iterations = 0;
	job_d.buf2_iterations = 0;
	job_d.buf1_len = 0;
	job_d.buf2_len = 0;
	job_d.duration = 0;
	job_d.timer = 0;
	memset(job_d.buf1, '\0', MAX_MSG_LEN + (COLS*2));
	memset(job_d.buf2, '\0', MAX_MSG_LEN + (COLS*2));
}

void set_backlight_flashing() {
	enable_backlight_flashing = 1;
}


void display_msg(int duration, char *msg1, char *msg2) {
	
	pthread_mutex_lock(&dmd->mutex);

	dmd->duration = duration;
	snprintf(dmd->msg1, MAX_MSG_LEN, "%s", msg1);
	snprintf(dmd->msg2, MAX_MSG_LEN, "%s", msg2);
	dmd->newMsg = 1;

	pthread_mutex_unlock(&dmd->mutex);

	
}

static char time_buf[32];
static char buf[32];
static struct tm *t;
static time_t tim;
static int idl_default_msg2_len;


void print_default_msg() {
	static int pos1 = 0;
	static int pos2 = 0;
	static int timer = 0;
		

	if (millis() < timer) {
		return;
	}

	timer = millis() + SCROLL_DELAY;

	if (show_default_msg2) {
		tim = time (NULL);
        	t = localtime (&tim);
        	sprintf(time_buf, "%02d:%02d:%02d", t->tm_hour, t->tm_min, t->tm_sec);
		lcdPosition(lcdHandle, (COLS - 8) / 2, 1); lcdPuts(lcdHandle, time_buf);
	} else {
		if (idl_default_msg2_len <= COLS) {
			lcdPosition(lcdHandle, 0, 1); lcdPuts(lcdHandle, idl_default_msg2);
		} else {
			strncpy(buf, &idl_default_msg2[pos2], COLS);
			buf[COLS] = 0;
			lcdPosition(lcdHandle, 0, 1); lcdPuts(lcdHandle, buf);
			
			if (++pos2 == (strlen(idl_default_msg2) - COLS)) {
                		pos2 = 0;
        		}
		}
	}
	
	strncpy(buf, &idl_default_msg1[pos1], COLS);
	buf[COLS] = 0;
	lcdPosition(lcdHandle, 0, 0); lcdPuts(lcdHandle, buf);

	if (++pos1 == (strlen(idl_default_msg1) - COLS)) {
		pos1 = 0;
	}
}

void print_job(int *job_in_progress) {
	
	char buf[32];

	if (millis() < job_d.timer) {
		return;
	}

	job_d.timer = millis() + SCROLL_DELAY;

	//line 1
	if (job_d.buf1_len <= COLS) {
		lcdPosition(lcdHandle, 0, 0); lcdPuts(lcdHandle, job_d.buf1);
		job_d.buf1_iterations = 1;
	} else {
		strncpy(buf, &job_d.buf1[job_d.buf1_pos], COLS);
		buf[COLS] = 0;
		lcdPosition(lcdHandle, 0, 0); lcdPuts(lcdHandle, buf);
		if (++job_d.buf1_pos == job_d.buf1_len - COLS) {
			job_d.buf1_pos = 0;
			job_d.buf1_iterations++;
		}
	}

	//line 2
        if (job_d.buf2_len <= COLS) {
                lcdPosition(lcdHandle, 0, 1); lcdPuts(lcdHandle, job_d.buf2);
		job_d.buf2_iterations = 1;
        } else {
                strncpy(buf, &job_d.buf2[job_d.buf2_pos], COLS);
                buf[COLS] = 0;
                lcdPosition(lcdHandle, 0, 1); lcdPuts(lcdHandle, buf);
                if (++job_d.buf2_pos == job_d.buf2_len - COLS) {
                        job_d.buf2_pos = 0;
                        job_d.buf2_iterations++;
                }
        }
	job_d.duration -= SCROLL_DELAY;

	if (job_d.buf1_iterations > 0 && job_d.buf2_iterations > 0 && job_d.duration < 0) {
		//job is printed;
		*job_in_progress = 0;
		digitalWrite(LIGHT, LOW);
		lcdClear(lcdHandle);
	}
}


void* th_start_display(void * arg) {

	int job_in_progress = 0;
	
	//init shared data struct
	dmd = malloc(sizeof (struct display_msg_sdata));
	if (dmd == NULL) {
		_LOG_ERR_("[TH_DISP] %s\n", "malloc error at init shared data struct");
		raise(SIGTERM);
		return (void *) 0;
	}
	pthread_mutex_init(&dmd->mutex, NULL);
	dmd->newMsg = 0;

	if (!show_default_msg2) {
		idl_default_msg2_len = strlen (idl_default_msg2);
	}

	//init lcd
	wiringPiSetup();
	lcdHandle = lcdInit(ROWS, COLS, BIT_MODE, RS, E, DB4, DB5, DB6, DB7, 0, 0, 0, 0);

	//set backlight pin
	pinMode (LIGHT, OUTPUT);
	
	if (lcdHandle < 0) {
		//printf("lcdInit failed\n");
		_LOG_ERR_("[TH_DISP] %s\n", "lcdInit failed");
		raise(SIGTERM);
		return (void *) 0;
	}

	lcdClear(lcdHandle); //clear display

	while (th_display_loop) {
	
		pthread_mutex_lock(&dmd->mutex);		
		if (dmd->newMsg) {

			//clear job struct
			initJobDetails();
			//clear display
			lcdClear(lcdHandle);
			//backlight ON
			digitalWrite(LIGHT, HIGH);

			job_in_progress = 1;
			if (strlen(dmd->msg1) > COLS) {
				snprintf(job_d.buf1, MAX_MSG_LEN, "                %s                ", dmd->msg1);
			} else {
				snprintf(job_d.buf1, MAX_MSG_LEN, "%s", dmd->msg1);
			}
			
			if (strlen(dmd->msg2) > COLS) {
				snprintf(job_d.buf2, MAX_MSG_LEN, "                %s                ", dmd->msg2);
			} else {
				snprintf(job_d.buf2, MAX_MSG_LEN, "%s", dmd->msg2);
			}
			job_d.buf1_len = strlen(job_d.buf1);
			job_d.buf2_len = strlen(job_d.buf2);
			job_d.duration = dmd->duration;
			dmd->newMsg = 0;
			//printf("%s %d - %s %d\n", job_d.buf1, job_d.buf1_len, job_d.buf2, job_d.buf2_len);
		}
		pthread_mutex_unlock(&dmd->mutex);
		
		if (enable_backlight_flashing) {
			if (!job_in_progress) {
				int i;
				for (i = 0; i < 4; i++) {
    					digitalWrite (LIGHT, HIGH) ;  // On
    					delay (100) ;               // mS
    					digitalWrite (LIGHT, LOW) ;   // Off
    					delay (100) ;
  				}
			}
			enable_backlight_flashing = 0;
		}


		if (!job_in_progress) {
		//print default idl msg
			print_default_msg();
			continue;
		}

		print_job(&job_in_progress);
	}

	lcdClear(lcdHandle);
	digitalWrite(LIGHT, LOW);
	return (void *) 0;
}
