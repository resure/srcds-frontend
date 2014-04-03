#!/bin/sh

case "$1" in
  start )
    echo "Running $2 $3" > test_status;;
  stop )
    echo "Halted" > test_status;;
  status )
    cat test_status;;
esac
