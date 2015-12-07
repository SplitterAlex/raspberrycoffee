
# Raspberry Pi Coffee Installation Guide

## Hardware installation

## WIRING

### LCD

Description | Pi pin # | LCD pin #
--- | ---| ---
VVD | 4 (5V) | 1
GND | 6 (GND) | 3
RS | 26 (GPIO7/CE1) | 4
E | 24 (GPIO8/CE0) | 6
DB4 | 11 (GPIO17) | 11
DB5 | 12 (GPIO28) | 12
DB6 | 13 (GPIO27) | 13
DB7 | 15 (GPIO22) | 14

### NFC-Reader PN532

Description | Pi pin # | NFC pin #
--- | ---| ---
3V | 1 (3V) | 5V/3V
GND | 9 (GND) | GND
GPIO2 | 3 (GPIO2/SDA) | MO/SDA/TX
GPIO3 | 5 (GPIO3/SCL) | NSS/SCL/RX

## Software installation

### Step 1:

[Download and install](https://www.raspberrypi.org/downloads/) a Rasbian Image on a SD-Card

### Step 2:

##### Set Raspberry Pi start configuartions, such as:

* set a user password
* set the timezone settings to Europe/Austria
* enable SSH

### Step 3:

##### Install GIT

```bash
pi@raspberrypi~$ sudo apt-get install git
```

##### Clone the git repository from:

https://dbis-git.uibk.ac.at:ifi/raspberrycoffee.git

### Step 4:

##### Install [libcurl](http://curl.haxx.se/) via:

```bash
pi@raspberrypi~$ sudo apt-get install libcurl4-openssl-dev
```

### Step 5:

##### Install [wiringPi](http://wiringpi.com/download-and-install)

```bash
pi@raspberrypi ~ $ git clone git://git.drogon.net/wiringPi
pi@raspberrypi ~ $ cd wiringPi
pi@raspberrypi ~/wiringPi $ sudo ./build
```

### Step 6:

#### Enable I2C

**Old Raspbian version:**

Edit the modules file

```bash
pi@raspberrypi ~ $ sudo nano /etc/modules
```
Add these lines:

```
i2c-bcm2708
i2c-dev
```

Exit and save the file

Now edit the modules blacklist file:

```bash
pi@raspberrypi ~ $ sudo nano /etc/modprobe.d/raspi-blacklist.conf
```
Add a '#' character to this line so it commented out:

```
#blacklist i2c-bcm2708
```
Exit and save the file.

**New Raspbian version:**

```bash
pi@raspberrypi ~ $ sudo raspi-config
```
Select "Advanced Options" and then select the relevant option.

HINT: If the I2C or SPI module doesnt work take a look [here](https://www.raspberrypi.org/forums/viewtopic.php?uid=121689&f=29&t=97314).

##### Install [ITEAD PN532 module with libnfc](http://blog.iteadstudio.com/raspberry-pi-drives-itead-pn532-nfc-module-with-libnfc/)

There exists a [installation tutorial](http://blog.iteadstudio.com/raspberry-pi-drives-itead-pn532-nfc-module-with-libnfc/).

**My steps:**

```bash
pi@raspberrypi ~ $ sudo apt-get install libusb-dev libpcsclite-dev
pi@raspberrypi ~ $ wget http://dl.bintray.com/nfc-tools/sources/libnfc-1.7.1.tar.bz2
pi@raspberrypi ~ $ tar -xf libnfc-1.7.1.tar.bz2
pi@raspberrypi ~ $ cd libnfc-1.7.1
pi@raspberrypi ~/libnfc-1.7.1 $ ./configure --prefix=/usr --sysconfdir=/etc
pi@raspberrypi ~/libnfc-1.7.1 $ make
pi@raspberrypi ~/libnfc-1.7.1 $ sudo make install
pi@raspberrypi ~/libnfc-1.7.1 $ cd /etc
pi@raspberrypi ~/libnfc-1.7.1 $ sudo mkdir nfc
pi@raspberrypi ~/libnfc-1.7.1 $ sudo nano /etc/nfc/libnfc.conf
```
**Copy and paste the following content to file /etc/nfc/libnfc.conf:**
>```
# Allow device auto-detection (default: true)
# Note: if this auto-detection is disabled, user has to set manually a device
# configuration using file or environment variable
allow_autoscan = true
```
>```
# Allow intrusive auto-detection (default: false)
# Warning: intrusive auto-detection can seriously disturb other devices
# This option is not recommended, user should prefer to add manually his device.
allow_intrusive_scan = false
```
>```
# Set log level (default: error)
# Valid log levels are (in order of verbosity): 0 (none), 1 (error), 2 (info), 3 (debug)
# Note: if you compiled with --enable-debug option, the default log level is "debug"
log_level = 1
```
>```
# Manually set default device (no default)
# To set a default device, you must set both name and connstring for your device
# Note: if autoscan is enabled, default device will be the first device available in device list.
device.name = "Itead_PN532"
device.connstring = "pn532_i2c:/dev/i2c-1"
```

**Run**
```bash
pi@raspberrypi ~ $ nfc-scan-device -v
```
**The result should bes something like:**
>```
nfc-scan-device uses libnfc 1.7.1
1 NFC device(s) found:
 - pn532_i2c:/dev/i2c-1:
...
```

### Step 7

#### Install and run [monit](http://mmonit.com/monit/)

```bash
pi@raspberrypi ~ $ sudo apt-get install monit
pi@raspberrypi ~ $ sudo mv /etc/monit/monitrc monitrc.back
pi@raspberrypi ~ $ sudo cp /home/pi/raspberrycoffee/raspberryClient/monitrc /etc/monit/
```

### Step 8

#### Install, configure and run a NRPE Client

```
pi@raspberrypi ~ $ sudo apt-get install nagios-nrpe-server nagios-plugins
```
This can take a while... Coffee break ;)

```
pi@raspberrypi ~ $ sudo update-rc.d nagios-nrpe-server
```

**Copy check sripts:**

```
pi@raspberrypi ~ $ sudo cp /home/pi/raspberrycoffee/raspberryClient/check_coffee_proc.sh /usr/lib/nagios/plugins/
pi@raspberrypi ~ $ sudo cp /home/pi/raspberrycoffee/raspberryClient/check_token.sh /usr/lib/nagios/plugins/
```

Edit **/etc/nagios/nrpe.cfg** to

>```
log_facility=daemon
pid_file=/var/run/nagios/nrpe.pid
server_port=5666
server_address=138.232.65.204
nrpe_user=nrpe
nrpe_group=nrpe
allowed_hosts=138.232.66.120
dont_blame_nrpe=0
debug=0
command_timeout=60
connection_timeout=300
include_dir=/etc/nagios/nrpe.d/
```
>```
command[check_token]=/usr/lib/nagios/plugins/check_token.sh
command[check_coffee_proc]=/usr/lib/nagios/plugins/check_coffee_proc.sh
```

### Step 9

#### Build the raspberry client and set the startup script

**Build**
```
pi@raspberrypi ~ $ cd /home/pi/raspberrycoffee/raspberryClient/controller && make
```
**Startup script**
```
pi@raspberrypi ~ $ sudo cp /home/pi/raspberrycoffee/raspberryClient/coffee_controller /etc/init.d/
pi@raspberrypi ~ $ sudo update-rc.d coffee_controller defaults
```

### Step 10

#### Edit network interface

Replace the following content to **/etc/network/interfaces**:

>```
auto lo
iface lo inet loopback
iface eth0 inet static
address 138.232.65.204
netmask 255.255.255.192
broadcast 138.232.65.255
gateway 138.232.65.254
```

and set a name server: **/etc/resolv.conf** e.g: 8.8.8.8

### Step 11

Restart raspberry pi

```
pi@raspberrypi ~ $ sudo reboot
```

The coffee_controller should start automatically and monit would restart the process if needed.

## Debug

Run the coffee_controller directly from the command line and you will get some debug prints

```
pi@raspberrypi ~ $ /home/pi/raspberrycoffee/raspberryClient/controller/./coffee_controller
```

## Logs

/home/pi/raspberrycoffee/raspberryClient/logs

## Access Token

You find the access token at **/home/pi/raspberrycoffee/raspberryClient/token**

**To create a new token:**

Create a user account for the **raspberry pi** at the database

Create a new array entry with the userId to **/webServer/config/config.json**

```javascript
    "pi": [
        //my new entry
        {
            "userId": [place the userId here],
            "tokenId": 0
        },
    ],
```

Run

```
$ node createNewPiAccessToken.js [userId] 
```
at the server (webServer/lib) and note the output (console).

Store the TOKEN at **/home/pi/raspberrycoffee/raspberryClient/token** and enter the TOKEN_ID at the new pi array entry at **/webServer/config/config.json**



## Miscellaneous

Restart the proccess from **monit** (recommended):
```
$ sudo monit [start] [stop] coffee_controller
```

Restart/Start the proccess from the **startup script**
```
$ sudo /etc/init.d/coffee_controller [start] [stop] [restart]
```




