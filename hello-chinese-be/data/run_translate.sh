#!/bin/bash
cd /mnt/sda1/hieubm/chinese4vn/hello-chinese-app-be/data
exec setsid python3 translate_direct.py >> translate_full.log 2>&1 &
echo "Translation PID: $!"
