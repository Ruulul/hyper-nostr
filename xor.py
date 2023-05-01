#!/usr/bin/env python3
import struct

key = 0xFEEEFEEE
with open('BLOCK_TIME', 'rb') as f:
    integer = f.read(4)  # In fact, you could read all in.
    while len(integer) >= 4:
        # if integer is not a string longer than 4, next line crash.
        # The return value is a tuple with integers.
        s, = struct.unpack('i', integer)
        print(key ^ s)
        integer = f.read(4)