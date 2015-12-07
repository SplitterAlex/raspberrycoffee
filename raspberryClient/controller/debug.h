/*
 * debug.h
 *
 *  Created on: Jan 21, 2015
 *      Author: alex
 */

#ifndef DEBUG_H_
#define DEBUG_H_

#ifdef DEBUG
#define DEBUG 1
#else
#define DEBUG 0
#endif

#define debug_print(fmt, ...) \
            do { if (DEBUG) fprintf(stdout, fmt, __VA_ARGS__); } while (0)


#endif /* DEBUG_H_ */
