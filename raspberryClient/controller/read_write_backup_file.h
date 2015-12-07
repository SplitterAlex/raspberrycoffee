/*
 * read_write_backup_file.h
 *
 *  Created on: Jan 22, 2015
 *      Author: alex
 */

#ifndef READ_WRITE_BACKUP_FILE_H_
#define READ_WRITE_BACKUP_FILE_H_

#include <stdio.h>
#include <stdlib.h>

#include <unistd.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <errno.h>
#include <fcntl.h>
#include <string.h>
#include <signal.h>
#include <pthread.h>

#include "cJSON.h"
#include "debug.h"
#include "network.h"
#include "log.h"
#include "config.h"

#define TMP_BACKUP_FILE_PATH "tmp_backup_file"


#define MAX_LINE_LENGTH 1024

int write_in_backup_file(const char *raw_json_str);
int have_unprocessed_bookings();
void *th_proceed_unprocessed_bookings();

#endif /* READ_WRITE_BACKUP_FILE_H_ */
