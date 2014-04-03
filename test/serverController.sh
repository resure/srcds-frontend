#!/bin/sh

case "$1" in
  start )
    echo "Running $2 $3" > test/current_status;;
  stop )
    echo "Halted" > test/current_status;;
  status )
    cat test/current_status;;
esac
