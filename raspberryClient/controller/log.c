/*
 * log.c
 *
 *  Created on: Jan 23, 2015
 *      Author: alex
 */


#include "log.h"

static FILE *log_file = NULL;
static FILE *err_file = NULL;

pthread_mutex_t log_mutex = PTHREAD_MUTEX_INITIALIZER;

/*
 * Function: get_current_time
 * ----------------------------
 *   return the actual time/date;
 *
 */
static char* get_current_time() {
	time_t curr_time;
	int len;
	char *time_str;
	curr_time = time(NULL);
	time_str = ctime(&curr_time);
	len = strlen(time_str);
	time_str[len-1] = '\0';
	return time_str;
}

/*
 * Function: _LOG_MSG_
 * ----------------------------
 *   writes a log msg with an acutal time in the log file
 *
 */
void _LOG_MSG_(const char* log_msg, ...) {
	static lines_write = 0;
	pthread_mutex_lock(&log_mutex);

	if (++lines_write > LOG_FILE_MAX_SIZE) {
		lines_write = 0;
		open_log_file();
	}


	va_list arg_pointer;
	va_start(arg_pointer, log_msg);
	fprintf(log_file, "[%s] ", get_current_time());
	vfprintf(log_file, log_msg, arg_pointer);
	va_end(arg_pointer);
	pthread_mutex_unlock(&log_mutex);
}

/*
 * Function: open_log_file
 * ----------------------------
 *   open/ceate a log file at the specified path
 *
 *   return 1 if no error occurs, otherwise -1
 *
 */
int open_log_file() {
	if (log_file != NULL) {
		if (fclose(log_file) != 0) {
			_LOG_ERR_("Can't close log file");
			perror("cant't close log file");
			log_file = NULL;
		}
	}

	log_file = fopen(LOG_FILE_PATH, "w");
	if (log_file == NULL) {
		_LOG_ERR_("[LOG] %s\n", "Can't open log file");
		perror("cant't open log file ");
		return -1;
	}
	if (setvbuf(log_file, NULL, _IOLBF, BUFSIZ) != 0) {
		_LOG_ERR_("[LOG] %s\n", "Error in setbuf log_file");
	}
	return 1;
}

/*
 * Function: close_log_files
 * ----------------------------
 *   close log file and err file
 *
 *   return 1 if no error occurs, otherwise -1
 *
 */
int close_log_files() {
	if (log_file != NULL) {
		if (fclose(log_file) != 0) {
			_LOG_ERR_("Can't close log file");
			perror("cant't close log file");
			return -1;
		}

	}
	if (err_file != NULL) {
		if (fclose(err_file) != 0) {
			_LOG_ERR_("Can't close err file");
			perror("cant't close err file");
			return -1;
		}
	}
	return 1;
}

/*
 * Function: redirect_stderr_to_log_err
 * ----------------------------
 *   Redirect the stderr to a specified log error file
 *
 *   return 1 if no error occurs, ohterwise -1
 */
int redirect_stderr_to_log_err() {
	if (err_file != NULL) {
		if (fclose(err_file) != 0) {
			_LOG_ERR_("Can't close log file");
			perror("cant't close log file");
			err_file = NULL;
		}
	}
	err_file = freopen(ERR_FILE_PATH, "a+", stderr);
	if (err_file == NULL) {
		_LOG_ERR_("[LOG] %s\n", "FATAL ERROR: Can`t redirect stderr to *.err file");
		perror("cant redirect stderr to *.err file");
		return -1;
	}
//	if (setvbuf(err_file, NULL, _IOLBF, BUFSIZ) != 0) {
//		_LOG_ERR_("[LOG] %s\n", "Error in setbuf log_file");
//	}
	return 1;
}

/*
 * Function: _LOG_ERR
 * ----------------------------
 *   writes an error msg in the err_log_file
 *
 *
 */
void _LOG_ERR_(const char* err_msg, ...) {
	va_list arg_pointer;
	va_start(arg_pointer, err_msg);
	fprintf(stderr, "[%s] ", get_current_time());
	vfprintf(stderr, err_msg, arg_pointer);
	fflush(stderr);
	va_end(arg_pointer);
}

