#!/bin/bash

coffee_proc_count=$(pgrep -f "coffee_controller" | wc -l)

return=2;

#echo $coffee_proc_count


if [[($coffee_proc_count -ge 2)]]; then
	echo "OK"
	return=0;


else 
	echo "CRITICAL - Process not found."
fi

#echo $return

exit $return;
