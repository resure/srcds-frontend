#!/bin/sh

case "$1" in
  start )
    sleep 2
    echo "Running $2 $3" > test/current_status;;
  update )
    sleep 2
    echo "Running $2 $3" > test/current_status;;
  stop )
    sleep 2
    echo "Halted" > test/current_status;;
  status )
    cat test/current_status;;
esac
