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
    millis = 0
    millis = int(round(time.time() * 1000)/1000)
    if DEBUG and VERBOSE:
        print("millis= " + str(millis))
    return millis


def getSeconds():
    if DEBUG:
        getMillis()
    global seconds
    seconds = 0
    seconds = int(round(time.time()))
    if DEBUG and VERBOSE:
        print("seconds=" + str(seconds))
    return seconds


def blockTime():
    try:
        global block_time
        block_time = blockcypher.get_latest_block_height(coin_symbol='btc')
        # assert block_time == 0
        assert block_time > 0
        if VERBOSE:
            print("block_time="+str(block_time))
        global block_height
        block_height = repr(block_time)
        if VERBOSE:
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
    btc_unix_time = "0"
    btc_unix_time = str(blockTime())+":"+str(getSeconds())
    return btc_unix_time


def WEEBLE_WOBBLE():
    return str(WEEBLE())+":"+str(WOBBLE())


def WEEBLE():
    global weeble
    global w_seconds
    global w_block_time
    w_seconds = getSeconds()
    if VERBOSE:
        print("w_seconds="+str(w_seconds))
    w_block_time = blockTime()
    # assert w_block_time == 0
    if VERBOSE:
        print("w_block_time="+str(w_block_time))
    if w_block_time > 0:
        weeble = math.floor(w_seconds / w_block_time)
        if VERBOSE:
            print("weeble="+str(weeble))
    if w_block_time <= 0:
        weeble = math.floor(w_seconds / 1)
        if VERBOSE:
            print("weeble="+str(weeble))
    return weeble


def WOBBLE():
    global wobble
    WEEBLE()
    """globally initialized in WOBBLE"""
    if w_block_time > 0:
        wobble = w_seconds % w_block_time
        if VERBOSE:
            print("wobble="+str(wobble))
    if w_block_time == 0:
        wobble = w_seconds / 1
        if VERBOSE:
            print("wobble="+str(wobble))
    return wobble


def getData(filename):
    f = open(filename, 'rb')
    global data
    data = f.read()
    f.close()
    return data


def tweetBlockTime(w_block_time):
    # blockTime()
    if VERBOSE or DEBUG:
        print(str(w_block_time)+":"+str(getSeconds()))
        print("BTC_UNIX_TIME() = " + str(BTC_UNIX_TIME()))
        print("WEEBLE() = " + str(WEEBLE()))
        print("WOBBLE() = " + str(WOBBLE()))
        print("WEEBLE:WOBBLE=" + str(WEEBLE()) + ":" + str(WOBBLE()))
        print("WEEBLE:WOBBLE=" + str(WEEBLE_WOBBLE()))
        print("DEBUG=" + str(DEBUG))
    if not DEBUG:
        if (w_block_time != obt):
            r = api.request('statuses/update',
                            {'status': str(w_block_time)+":"+str(getSeconds)})
            r = api.request('statuses/update',
                            {'status': str(BTC_UNIX_TIME())})
            # exit()
            if (r.status_code == 200):
                if VERBOSE:
                    print('api.request SUCCESS')
            else:
                if VERBOSE:
                    print('api.request FAILURE')
        else:
            # print("VERBOSE=" + VERBOSE)
            if VERBOSE:
                print(w_block_time == obt)
                print('w_block_time='+w_block_time)
                print('tweetBlockTime() FAILURE')


def getMempoolAPI(url, DATA):
    if VERBOSE:
        print(url)
    with open(DATA, 'wb') as f:
        r = requests.get(url, stream=True)
        f.writelines(r.iter_content(1024))
        response = getData(DATA)
        if VERBOSE:
            print(getData(DATA))
            print(response)


def searchBitcoin():
    global r
    r = api.request('search/tweets', {'q': 'bitcoin'})
    for item in r:
        if VERBOSE:
            # print("")
            print(item)
        if DEBUG:
            try:
                if VERBOSE:
                    # print(item) # not what we want
                    # print(dir(item)) #  not what we want
                    print(str(item))
                    # print("                                    ")
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
                # print("VERBOSE=" + str(VERBOSE))
                if VERBOSE:
                    print()
                    # print(data)
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
                if VERBOSE:
                    print()
                    # print(type(data))
                if str(type(data)) == "<class 'bytes'>":
                    # only possible in Python 3
                    try:
                        data = data.decode('latin-1')
                    except UnicodeDecodeError:
                        data = data.decode('UTF-16LE')
                        # data = str(data)[2:-1]
                    except BaseException as error:
                        print('searchTwitter(): {}'.format(error))
                    if VERBOSE:
                        print()
                        # print(data)
                elif str(type(data)) == "<type 'unicode'>":
                    # only possible in Python 2
                    data = str(data)
                    if VERBOSE:
                        print()
                        # print(data)
                else:
                    if VERBOSE:
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
    if VERBOSE:
        print(n.digest())
        print("n.digest()=" + str(n.digest()))
    #n.update(bytes(recipient, 'utf-8'))
    n.update(bytes(message, 'utf-8'))
    #n.update(bytes(btc_unix_time, 'utf-8'))
    if VERBOSE:
        print(n.digest())
        print(n.digest_size)
    # 32
        print(n.block_size)
    # 64
        print(n.hexdigest())
    return n.hexdigest()


def syndicateMessage(block_time):
    if VERBOSE:
        print(not DEBUG)
        print("block_time="+str(block_time))
        print("obt="+str(obt.decode()))
        print("WEEBLE:WOBBLE=" + str(WEEBLE_WOBBLE()))
    if not DEBUG:
        if (block_time != obt):
            if is_tool('nostril'):
                message = \
                    ""
                digest = \
                    HEX_MESSAGE_DIGEST(GPGID, message)
                cmd_str = \
                    "nostril --envelope --content '" \
                    + str(WEEBLE_WOBBLE()) \
                    + " " \
                    + message + ":" + digest \
                    + "' | websocat ws://localhost:3000/nostr"
                if VERBOSE:
                    print(cmd_str)
                print("cmd_str=" + cmd_str)
                subprocess.run(cmd_str, shell=True)
                r = api.request('statuses/update',
                                {'status':
                                'GPGID:' + GPGID
                                 + ':MESSAGE:' + message
                                 + ':DIGEST:' + digest
                                 + ':WEEBLE:WOBBLE:' + WEEBLE_WOBBLE()
                                 + ':BTC:UNIX:' + BTC_UNIX_TIME()
                                 })
                if VERBOSE:
                    print(r.text)
                    print("" + message + "" + digest + "" + cmd_str + "")
            else:
                message = "test twitter syndication"
                digest = HEX_MESSAGE_DIGEST(GPGID, message)
                if VERBOSE:
                    print("GPGID=" + GPGID)
                    print("message=" + message)
                    print("digest=" + digest)
                    print("BTC:UNIX=" + BTC_UNIX_TIME())
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
            if VERBOSE:
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
    if is_tool(name):
        # from distutils.spawn import find_executable
        # return find_executable(name) is not None
        return which(name)
    else:
        return 0


def initialize(DEBUG):

    ACCESS_TOKEN_SECRET = \
        os.path.expanduser(
            './twitter_access_tokens/access_token_secret.txt')
    assert ACCESS_TOKEN_SECRET != ""
    ACCESS_TOKEN = \
        os.path.expanduser(
            './twitter_access_tokens/access_token.txt')
    assert ACCESS_TOKEN != ""
    CONSUMER_API_KEY = \
        os.path.expanduser(
            './twitter_access_tokens/consumer_api_key.txt')
    assert CONSUMER_API_KEY != ""
    CONSUMER_API_SECRET_KEY = \
        os.path.expanduser(
            './twitter_access_tokens/consumer_api_secret_key.txt')
    assert CONSUMER_API_SECRET_KEY != ""

    global cak, cask, at, ats, obt
    cak = getData(CONSUMER_API_KEY)
    assert cak != ""
    cask = getData(CONSUMER_API_SECRET_KEY)
    assert cask != ""
    at = getData(ACCESS_TOKEN)
    assert at != ""
    ats = getData(ACCESS_TOKEN_SECRET)
    assert ats != ""
    global api
    api = TwitterAPI(cak, cask, at, ats)

    BLOCK_TIP_HEIGHT = \
        os.path.expanduser(
            './BLOCK_TIP_HEIGHT')
    DIFFICULTY = \
        os.path.expanduser(
            './DIFFICULTY')
    OLD_BLOCK_TIME = \
        os.path.expanduser(
            './OLD_BLOCK_TIME')

    obt = getData(OLD_BLOCK_TIME)
    assert obt != ""

    try:
        getMempoolAPI(
            'https://mempool.space/api/v1/difficulty-adjustment', DIFFICULTY)
        getMempoolAPI(
            'https://mempool.space/api/blocks/tip/height', BLOCK_TIP_HEIGHT)
    except BaseException as error:
        print('getMempoolAPI(): {}'.format(error))

    """declare some global variables"""
    global GPGID, NOSTRIL, WEBSOCAT, YARN
    GPGID = 'BB06757B'
    NOSTRIL = is_tool('nostril')
    WEBSOCAT = is_tool('websocat')
    YARN = is_tool('yarn')
    global message, digest, cmd_str
    message = ""
    digest = ""
    cmd_str = ""
    try:
        # if YARN:
        #     try:
        #         cmd_str = "yarn && yarn install && yarn run start"
        #         subprocess.run(cmd_str, shell=True)
        #     except BaseException as error:
        #         print('yarn && yarn install && yarn run start: {}'.format(error))
        global weeble
        weeble = -1
        BTC_UNIX_TIME()
    except NameError:
        print("BTC_UNIX_TIME() not available yet...")
    except BaseException as error:
        print('BTC_UNIX_TIME(): {}'.format(error))

    if VERBOSE:
        print("NOSTRIL="+str(NOSTRIL))
        print("which nostril"+which_tool('nostril'))
        print("WEBSOCAT="+str(WEBSOCAT))
        print("YARN="+str(YARN))
        print("BTC_UNIX_TIME()="+BTC_UNIX_TIME())

    if DEBUG:
        HEX_MESSAGE_DIGEST(GPGID, "")

        if (is_tool('nostril')):
            cmd_str = \
                        "nostril --envelope --content '" \
                        + message +\
                        ":" \
                        + digest +\
                        "' | websocat ws://localhost:3000/nostr"
            if VERBOSE:
                print(cmd_str)
            print(cmd_str)
            subprocess.run(cmd_str, shell=True)

    if VERBOSE:
        print(blockTime())
        print(getSeconds())
        print(getMillis())

        m = hashlib.sha256()
        m.update(b"Nobody inspects")
        m.update(b" the spammish repetition")
        if VERBOSE:
            print(m.digest())
            print(m.digest_size)
            print("WEEBLE_WOBBLE="+WEEBLE_WOBBLE())
            # 32
            print(m.block_size)
            # 64
            print(m.hexdigest())


global DEBUG
DEBUG = 1
if DEBUG:
    print("DEBUG="+str(DEBUG))
global VERBOSE
VERBOSE = 0
if VERBOSE:
    print("VERBOSE="+str(VERBOSE))
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

