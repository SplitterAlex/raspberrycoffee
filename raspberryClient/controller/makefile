CC = gcc
# -DSELF_SIGNED_CERT

CFLAGS = -g3 -Wall -Wno-unused-variable -DDEBUG
LDFLAGS = -lm -lpthread -lcurl -lnfc -lwiringPi -lwiringPiDev

OBJ = cJSON.o controller.o log.o main.o mci.o network.o read_write_backup_file.o nfc.o display.o

all: coffee_controller

coffee_controller: $(OBJ)
	$(CC) $(CFLAGS) -o coffee_controller $(OBJ) $(LDFLAGS)

%.o: %.c
	$(CC) $(CFLAGS) -c $<

clean:
	rm *.o
