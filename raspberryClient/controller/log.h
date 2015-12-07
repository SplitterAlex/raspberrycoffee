/*
 * log.h
 *
 *  Created on: Jan 23, 2015
 *      Author: alex
 */

#ifndef LOG_H_
#define LOG_H_


#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <fcntl.h>
#include <string.h>
#include <stdarg.h>
#include <pthread.h>
#include "config.h"


#define LOG_FILE_MAX_SIZE 1000


int open_log_file();
int close_log_files();
int redirect_stderr_to_log_err();
void _LOG_ERR_(const char* err_msg, ...);
void _LOG_MSG_(const char* log_msg, ...);

#endif /* LOG_H_ */
