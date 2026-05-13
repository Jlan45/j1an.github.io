#!/bin/bash
set -e
msg="${1:-update site}"
git add -A
git commit -m "$msg"
git push
