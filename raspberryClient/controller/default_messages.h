#ifndef DEFAULT_MESSAGES_H_
#define DEFAULT_MESSAGES_H_

/*
 * Message will shown if an authentication request
 * to the server failed (No Server Connection,
 * failure at the Server);
 *
 * Message duration defined by:
 * TIMEOUT_AFTER_AUTH (config.h) * 1000 (milli seconds)
 */
static char *default_msg_after_auth1 = 
"       OK       ";

static char *default_msg_after_auth2 =
" Choose an item ";

/*
 * Message will shown if the timeout expired,
 * after a authentication request and the user
 * doesnt pressed a button at the cfe-machine
 */
static char *timeout_expired_msg1 = 
"     Timeout    ";

static char *timeout_expired_msg2 =
" Too slow . . . ";

static int timeout_expired_time = 5000;

/*
 * This message will shown if a user pressed a
 * button after an authentication, and the user
 * doesnt have enough credit to choose this item
 */
static char *not_enough_credit_for_item_msg1 =
" non-cash for yo";

static char *not_enough_credit_for_item_msg2 =
"ur choosen item!";

static int not_enough_credit_for_item_time = 10000;

/*
 * This message will shown, when the controller
 * startup was successfully
 */
static char *controller_startup_msg1 =
"Controller start";

static char *controller_startup_msg2 =
"was successful!";

static int controller_startup_time = 3000;

/*
 * This message will shown, if the controller
 * stand idle (waits for authentication requests)
 *
 * DEFAULT: The second line of the display
 * will shown the actual time unless it's prefered
 * to show an other message. In this case set the
 * variable show_default_msg2 to 0 and define a
 * message at idl_default_msg2. If the msg will be
 * longer than 16 Characters dont forget to add 16
 * whitespaces at the start and the end of the msg!
 *
 * 
 */
static char *idl_default_msg1 =
"                "
"READY to read your chip/card"
"                ";

static int show_default_msg2 = 1;

static char *idl_default_msg2 =
"";







#endif /* DEFAULT_MESSAGES_H_  */
