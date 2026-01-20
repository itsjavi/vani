#!/bin/bash

set -e # exit when any command fails

echo "Running $1 test"

HTML_FILENAME="src/debug/$1-test.html"
TS_FILENAME="src/debug/$1-test.ts"

if [ ! -f "$HTML_FILENAME" ]; then
  echo "File $HTML_FILENAME does not exist"
  exit 1
fi

if [ ! -f "$TS_FILENAME" ]; then
  echo "File $TS_FILENAME does not exist"
  exit 1
fi

bun run --watch "$HTML_FILENAME"
