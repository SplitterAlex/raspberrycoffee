#!/bin/bash

RESPONSE=response.txt
HEADERS=headers.txt
HOST=placeURLHere

TOKEN=$(cat /home/pi/raspberrycoffee/raspberryClient/token)

status=$(curl -s -w '%{http_code}' \
   -H "Authorization:Bearer $TOKEN" $HOST -o /dev/null)


case $status in

200)
	echo "OK - Http code returned $status"
	exit 0
;;
000)
	echo "CRITICAL - No HTTP code returned"
	exit 2
;;
*)
	echo "CRITICAL - Wrong HTTP code $status returned"
	exit 2
;;
esac
