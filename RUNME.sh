#! /usr/bin/bash

# Steps to installation.
# check for all requirements... sudo, apache, systemctl, etc.
# Git clone latest.
# Create a new group + user for the CockPit.
# Check to make sure sudo is installed...
# Modify sudoers file to allow cockpit to copy logs, deploy to /var/www folder and restart services.
# install cockpit to /var/www and setup service.d and init.d to launch on startup.
# create entry in apache.conf/sites-enabled 

# useful commands
# this creates a homeless daemon account.  
sudo useradd -r -s /bin/false cockpit-auto


