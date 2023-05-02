#!/usr/bin/env python3
# https://github.com/geduldig/TwitterAPI
import sys
import os
import traceback
import logging
import math
import requests
import shutil
import subprocess
import pickle
import codecs
import json

# import importlib
# from importlib.resources import read_text
import time
import blockcypher
import hashlib
import pyjq
# os.environ['PYTHONPATH']
sys.path.append('.')
sys.path.append("/usr/local/lib/python3.9/site-packages")
sys.path.append("/usr/local/lib/python3.10/site-packages")
sys.path.append("/usr/local/lib/python3.11/site-packages")
from TwitterAPI import TwitterAPI


def decode(s, encodings=('ascii', 'utf8', 'latin1')):
    for encoding in encodings:
        try:
            return s.decode(encoding)
        except UnicodeDecodeError:
            pass
    return s.decode('ascii', 'ignore')


def moveBlockTime():
    try:
        shutil.move(os.getcwd()+"/BLOCK_TIME", os.getcwd()+"/OLD_BLOCK_TIME")
    except BaseException as error:
        print('moveBlockTime(): {}'.format(error))
        f = open("BLOCK_TIME", "w")
        f.write("" + 0 + "\n")
        f.close()


def getMillis():
    global millis
    millis = int(round(time.time() * 1000))
    return millis


def getSeconds():
    global seconds
    seconds = int(round(time.time()))
    return seconds


def blockTime():
    try:
        global block_time
        block_time = blockcypher.get_latest_block_height(coin_symbol='btc')
        # assert block_time == 0
        assert block_time > 0
        print("block_time="+str(block_time))
        global block_height
        block_height = repr(block_time)
        print("block_height="+block_height)
        f = open("BLOCK_TIME", "w")
        f.write("" + block_height + "\n")
        f.close()
        return block_time
    except BaseException as error:
        print('blockTime(): {}'.format(error))
        return 0
        pass


def BTC_UNIX_TIME():
    global btc_unix_time
    btc_unix_time = str(blockTime())+":"+str(getSeconds())
    return btc_unix_time


def WEEBLE_WOBBLE():
    return str(WEEBLE())+":"+str(WOBBLE())


def WEEBLE():
    global weeble
    global wobble
    global w_seconds
    global w_block_time
    w_seconds = getSeconds()
    print("w_seconds="+str(w_seconds))
    w_block_time = blockTime()
    # assert w_block_time == 0
    print("w_block_time="+str(w_block_time))
    # weeble = math.floor(w_seconds / w_block_time)
    if w_block_time > 0:
        weeble = w_seconds / w_block_time
        print("weeble="+str(weeble))
    if w_block_time == 0:
        weeble = w_seconds / 1
        print("weeble="+str(weeble))
    return weeble


def WOBBLE():
    """globally initialized in WOBBLE"""
    if w_block_time > 0:
        wobble = w_seconds % w_block_time
        print("wobble="+str(wobble))
    if w_block_time == 0:
        wobble = w_seconds / 1
        print("wobble="+str(wobble))
    return wobble


def getData(filename):
    f = open(filename, 'rb')
    global data
    data = f.read()
    f.close()
    return data


def tweetBlockTime(block_time):
    print(str(w_block_time)+":"+str(getSeconds()))
    print("BTC_UNIX_TIME()="+BTC_UNIX_TIME())
    print(not DEBUG)
    if not DEBUG:
        if (w_block_time != obt):
            r = api.request('statuses/update',
                            {'status': str(w_block_time)+":"+str(getSeconds)})
            r = api.request('statuses/update',
                            {'status': str(BTC_UNIX_TIME())})
            # exit()
            if (r.status_code == 200):
                print('api.request SUCCESS')
            else:
                print('api.request FAILURE')
        else:
            print(w_block_time == obt)
            print('w_block_time='+w_block_time)
            print('tweetBlockTime() FAILURE')


def getMempoolAPI(url, DATA):
    print(url)
    with open(DATA, 'wb') as f:
        r = requests.get(url, stream=True)
        f.writelines(r.iter_content(1024))
        response = getData(DATA)
        if DEBUG:
            print(getData(DATA))
            print(response)


def searchBitcoin():
    global r
    r = api.request('search/tweets', {'q': 'bitcoin'})
    for item in r:
        # print(item)

        if DEBUG:
            try:
                print(item)
                # print(dir(item))
                # print(str(item))
                print("                                    ")
            except UnicodeDecodeError:
                item = print(decode(item))
            except BaseException as error:
                print('searchBitcoin(): {}'.format(error))
            finally:
                item = str('decoding error!')
        with open('search/tweets/bitcoin', 'wb') as f:
            pickle.dump(item, f)
        data = getData('search/tweets/bitcoin')
        if DEBUG:
            # prints byte like objects
            try:
                print(data)
            except UnicodeDecodeError:
                data = decode(data)
            except BaseException as error:
                print('searchBitcoin(): {}'.format(error))
            finally:
                data = str('decoding error!')


def searchTwitter(term):
    global r
    r = api.request('search/tweets', {'q': term})
    for item in r:
        with open('search/tweets/'+term, 'wb') as f:
            pickle.dump(item, f)
        data = getData('search/tweets/'+term)
        if DEBUG:
            try:
                # convert bytes (python 3) or unicode (python 2) to str
                print(type(data))
                if str(type(data)) == "<class 'bytes'>":
                    # only possible in Python 3
                    try:
                        data = data.decode('latin-1')
                    except UnicodeDecodeError:
                        data = data.decode('UTF-16LE')
                        # data = str(data)[2:-1]
                    except BaseException as error:
                        print('searchTwitter(): {}'.format(error))
                    print(data)
                elif str(type(data)) == "<type 'unicode'>":
                    # only possible in Python 2
                    data = str(data)
                    print(data)
                else:
                    print(decode(data))

            except UnicodeDecodeError:
                data = decode(data)
            except BaseException as error:
                print('searchBitcoin(): {}'.format(error))
            finally:
                data = str('decoding error!')
        f.close()


def HEX_MESSAGE_DIGEST(recipient, message):
    if int(weeble) < 1:
        BTC_UNIX_TIME()
    if not is_tool('nostril'):
        which_tool('nostril')
    n = hashlib.sha256()
    n.update(bytes(recipient, 'utf-8'))
    n.update(bytes(message, 'utf-8'))
    n.update(bytes(btc_unix_time, 'utf-8'))
    # print(n.digest())
    # b'\x03\x1e\xdd}Ae\x15\x93\xc5\xfe\\\x00o\xa5u+7\xfd\xdf\xf7\xbcN\x84:\xa6\xaf\x0c\x95\x0fK\x94\x06'
    # print(n.digest_size)
    # 32
    # print(n.block_size)
    # 64
    # print(n.hexdigest())
    return n.hexdigest()


def syndicateMessage(block_time):
    print(not DEBUG)
    print("block_time="+str(block_time))
    print("obt="+str(obt.decode()))
    if not DEBUG:
        if (block_time != obt):

            # r = api.request('statuses/update',
            #                 {'status':
            #                  block_time+":"+getSeconds
            #                  })

            if is_tool('nostril'):
                message = \
                    "test twitter/nostr syndication"
                digest = \
                    HEX_MESSAGE_DIGEST(GPGID, message)
                cmd_str = \
                    "nostril --envelope --content '" \
                    + message + " " + digest + \
                    "' | websocat ws://localhost:3000/nostr"
                subprocess.run(cmd_str, shell=True)
                r = api.request('statuses/update',
                                {'status':
                                 "GPGID:" + GPGID
                                 + ':MESSAGE:' + message
                                 + ':DIGEST:' + digest
                                 + ':TOOL:' + str(is_tool('nostril'))
                                 + ':WHICHTOOL:' + str(which_tool('nostril'))
                                 + ':BTC:UNIX:' + BTC_UNIX_TIME()
                                 })
                print(r.text)
                print("" + message + "" + digest + "" + cmd_str + "")
            else:
                message = "test twitter syndication"
                digest = HEX_MESSAGE_DIGEST(GPGID, message)
                r = api.request('statuses/update',
                                {'status':
                                 "GPGID:"+GPGID
                                 + ':MESSAGE:' + message
                                 + ':DIGEST:' + digest
                                 + 'BTC:UNIX:' + BTC_UNIX_TIME()
                                 })
            # r = api.request('statuses/update', \
            # {'status': HEX_MESSAGE_DIGEST(GPGID,"test message")})
            # print(BTC_UNIX_TIME)
            # exit()
            # if (r.status_code == 200):
            #     print('api.request SUCCESS')
            # else:
            #     print('api.request FAILURE')

        else:
            print('tweetBlockTime() FAILURE')


def is_tool(name):
    """Check whether `name` is on PATH and marked as executable."""

    # from whichcraft import which
    from shutil import which

    # from distutils.spawn import find_executable
    # return find_executable(name) is not None
    return which(name) is not None


def which_tool(name):
    """Check whether `name` is on PATH and marked as executable."""
    from shutil import which

    # from distutils.spawn import find_executable
    # return find_executable(name) is not None
    return which(name)


global NOSTRIL
NOSTRIL = is_tool('nostril')
print("NOSTRIL="+str(NOSTRIL))
WEBSOCAT = is_tool('websocat')
print("WEBSOCAT="+str(WEBSOCAT))

    try:
        getMempoolAPI(
            'https://mempool.space/api/v1/difficulty-adjustment', DIFFICULTY)
        getMempoolAPI(
            'https://mempool.space/api/blocks/tip/height', BLOCK_TIP_HEIGHT)
    except BaseException as error:
        print('getMempoolAPI(): {}'.format(error))

    """declare some global variables"""
    global NOSTRIL, WEBSOCAT, YARN, GPGID
    GPGID = 'BB06757B'
    NOSTRIL = is_tool('nostril')
    WEBSOCAT = is_tool('websocat')
    YARN = is_tool('yarn')
    try:
        global weeble
        weeble = -1
        BTC_UNIX_TIME()
    except NameError:
        print("BTC_UNIX_TIME() not available yet...")
    except BaseException as error:
        print('BTC_UNIX_TIME(): {}'.format(error))

    global message
    message = ""
    global digest
    digest = ""

    if DEBUG:
        print("NOSTRIL="+str(NOSTRIL))
        print("which nostril"+which_tool('nostril'))
        print("WEBSOCAT="+str(WEBSOCAT))
        print("YARN="+str(YARN))
        print("BTC_UNIX_TIME()="+BTC_UNIX_TIME())

        HEX_MESSAGE_DIGEST(GPGID, "test message")
        HEX_MESSAGE_DIGEST(GPGID, str(NOSTRIL))

        if (is_tool('nostril')):
            cmd_str = \
                        "nostril --envelope --content '" \
                        + message +\
                        " " \
                        + digest +\
                        "' | websocat ws://localhost:3000/nostr"
            print(cmd_str)
            subprocess.run(cmd_str, shell=True)

    if DEBUG:
        print(blockTime())
        print(getSeconds())
        print(getMillis())

        m = hashlib.sha256()
        m.update(b"Nobody inspects")
        m.update(b" the spammish repetition")
        print(m.digest())
# b'\x03\x1e\xdd}Ae\x15\x93\xc5\xfe\\\x00o\xa5u+7\xfd\xdf\xf7\xbcN\x84:\xa6\xaf\x0c\x95\x0fK\x94\x06'
        print(m.digest_size)
        print("WEEBLE_WOBBLE="+WEEBLE_WOBBLE())
# 32
        print(m.block_size)
# 64
        print(m.hexdigest())


global DEBUG
DEBUG = 1
try:
    initialize(DEBUG)
except BaseException as error:
    print('initialize(DEBUG): {}'.format(error))
try:
    searchBitcoin()
except BaseException as error:
    print('searchBitcoin(): {}'.format(error))
try:
    searchTwitter('bitcoin')
except BaseException as error:
    print('searchTwitter(bitcoin): {}'.format(error))
try:
    searchTwitter('nostr')
except BaseException as error:
    print('searchTwitter(nostr): {}'.format(error))
try:
    tweetBlockTime(blockTime())
except BaseException as error:
    print('tweetBlockTime(blockTime(): {}'.format(error))
try:
    syndicateMessage(blockTime())
except BaseException as error:
    print('syndicateMessage(blockTime(): {}'.format(error))

