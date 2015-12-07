/*
 * read_write_backup_file.c
 *
 *  Created on: Jan 22, 2015
 *      Author: alex
 */

#include "read_write_backup_file.h"


/*
 * Function: write_in_backup_file
 * ----------------------------
 *   if a booking order fails (e.g Network Error), write the order
 *   in a backup file and catch them up later.
 *
 *	const char *raw_json_str:
 *	holds the json string
 *
 *	return 1 if no error occurs, otherwise 0
 *
 */
int write_in_backup_file(const char *raw_json_str) {
	FILE *backup_file;
	int ret;
	struct flock lock;

	backup_file = fopen(BACKUP_FILE_PATH, "a");
	if (backup_file == NULL) {
		_LOG_ERR_("[IO_BACKUP_FILE] %s\n", "Can't open backup file, in functin \"write_in_file\"");
		perror("[IO_BACKUP_FILE] ");
		return 0;
	}

	/* Initialize the flock structure. */
	memset(&lock, 0, sizeof(lock));
	lock.l_type = F_WRLCK; //exklusive
	//lock.l_whence = SEEK_CUR;
	fcntl(fileno(backup_file), F_SETLKW, &lock);


	ret = fprintf(backup_file, "%s\n", raw_json_str);
	if (ret == EOF) {
		_LOG_ERR_("[IO_BACKUP_FILE] %s\n", "cant write in backup file. error in fprint()");
		perror("[IO_BACKUP_FILE] ");
		lock.l_type = F_UNLCK;
		fcntl(fileno(backup_file), F_SETLKW, &lock);
		fclose(backup_file);
		return 0;
	}

	fflush(backup_file);
	lock.l_type = F_UNLCK;
	fcntl(fileno(backup_file), F_SETLKW, &lock);
	fclose(backup_file);

	return 1;
}

/*
 * Function: have_unprocessed_bookings
 * ----------------------------
 *   check here if the backup_file is empty or not
 *   if its not empty, the process create a thread
 *   and catch up all unprocessed bookings to the
 *   server
 *
 *   return the size of the backup file, or -1 if an
 *   error occurs
 *
 */
int have_unprocessed_bookings() {
	FILE *backup_file;
	size_t size;

	backup_file = fopen(BACKUP_FILE_PATH, "a+");
	if (backup_file == NULL) {
		_LOG_ERR_("[IO_BACKUP_FILE] %s\n", "Can't open backup file, in function \"have_unprocessed_bookings\"");
		perror("[IO_BACKUP_FILE] ");
		return -1;
	}

	fseek(backup_file, 0L, SEEK_END);

	size = ftell(backup_file);
	if (size < 0) {
		_LOG_ERR_("[IO_BACKUP_FILE] %s\n", "Error in function \"have_unprocced_bookings\". ftell() return value is -1");
	}
	fclose(backup_file);

	//DEBUG
	//fprintf(stderr, "SIZE: %d\n", (int) size);

	return (int) size;
}

/*
 * Function: exit_handler_th_proceed_unprocessed_bookings
 * ----------------------------
 *   proceed if the thread exit or fails.
 *
 *   flip the variable start_thread (init at controller.c) to 0 (false)
 *   and signals the main_thread the thread is finished.
 *
 */
static void exit_handler_th_proceed_unprocessed_bookings(void *arg) {
	//debug_print("[DEBUG] [IO_BACKUP_FILE] %s\n", "reached exit handler . . .");
	int *i = (int *) arg;
	*i = 0;
}

/*
 * Function: th_proceed_unprocessed_bookings
 * ----------------------------
 *   function owned by a thread. Start point at controller.c
 *   if the thread not already started, and the backup file is
 *   not empty.
 *
 *   To avoid rage conditions at the backup file, the thread
 *   locks the file and copy all unprocessed bookings in a tmp
 *   file and delete all entrys in the bakup file und unlock
 *   the file.
 *
 *	to avoid memory leaks and memory overflows, the thread proceed
 *	only a limited amount of bookings (json array) in one piece to
 *	the server. Actually this function bunch 20 bookings to the
 *	server successive till the backup file is empty.
 *
 */
void *th_proceed_unprocessed_bookings(void *arg) {
	int *thread_started = (int *)arg;

	FILE *backup_file;
	FILE *tmp_file;

	struct flock lock;

	char puffer[MAX_LINE_LENGTH];
	char *file_is_empty;

	pthread_cleanup_push(exit_handler_th_proceed_unprocessed_bookings, (void *)thread_started);

	backup_file = fopen(BACKUP_FILE_PATH, "r");
	if (backup_file == NULL) {
		_LOG_ERR_("[IO_BACKUP_FILE] %s\n", "Can't open backup file, in function \"proceed_unprocessed_bookings\"");
		perror("[IO_BACKUP_FILE] ");
		return 0;
	}

	tmp_file = fopen(TMP_BACKUP_FILE_PATH, "w+");
	if (tmp_file == NULL) {
		_LOG_ERR_("[IO_BACKUP_FILE] %s\n", "Can't open tmp backup file, in function \"proceed_unprocessed_bookings\"");
		perror("[IO_BACKUP_FILE] ");
		fclose(backup_file);
		return 0;
	}

	/* Initialize the flock structure. */
	memset(&lock, 0, sizeof(lock));
	lock.l_type = F_WRLCK; //exklusive
	//lock.l_whence = SEEK_CUR;
	fcntl(fileno(backup_file), F_SETLKW, &lock);

	//copy backup_file
	while(fgets(puffer, MAX_LINE_LENGTH, backup_file) != NULL) {
		fprintf(tmp_file, "%s", puffer);
	}

	fflush(backup_file);
	fflush(tmp_file);

	//delete all entries in the backup_file
	freopen(BACKUP_FILE_PATH, "w", backup_file);

	lock.l_type = F_UNLCK;
	fcntl(fileno(backup_file), F_SETLKW, &lock);

	fclose(backup_file);

	fseek(tmp_file, 0L, SEEK_SET);

        int succ;
	while(1) {
		file_is_empty = fgets(puffer, MAX_LINE_LENGTH, tmp_file);
		if (file_is_empty == NULL) {
		        //debug_print("%s\n", "[DEBUG] [IO_BACKUP_FILE] file is empty");
                                    break;
		}
		printf("file is empty: %s\n", file_is_empty);

                puffer[strlen(puffer)-1] = '\0';
		//debug_print("[DEBUG] [IO_BACKUP_FILE] try to catch up unprocessed booking: %s\n", puffer);
		//succ = 1;
		succ = push_unprocessed_bookings_to_server(puffer);
		if(succ == 1) {
			//debug_print("%s\n", "[DEBUG] [IO_BACKUP_FILE] Catch up unprocessed booking was successfully");
		} else {
			debug_print("%s\n", "[DEBUG] [IO_BACKUP_FILE] Catch up unprocessed booking was not successfully");
			debug_print("%s\n", "[DEBUG] [IO_BACKUP_FILE] Restore booking at backup file");

			if(!write_in_backup_file(puffer)) {
			        _LOG_ERR_("[IO_BACKUP_FILE] Cant restore backup_file with: %s", puffer);
			}
                                }
/*
		if (succ == fatal_error) {
		    debug_print("%s\n", "[DEBUG] [IO_BACKUP_FILE] Catch up unprocessed_bookings - FATAL_ERROR");
		    _LOG_ERR_("[IO_BACKUP_FILE] %s\n", "Catch up unprocessed_bookings - FATAL_ERROR - Send signal SIGTERM");
		    raise(SIGTERM);
		}
		*/
	}

	fclose(tmp_file);

	//debug_print("[DEBUG] [IO_BACKUP_FILE] %s\n", "proceed unprocessed bookings thread exit");

	pthread_cleanup_pop(1);

	return 0;
}
