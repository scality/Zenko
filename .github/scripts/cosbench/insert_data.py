#!/usr/bin/env python

import gspread
from oauth2client.service_account import ServiceAccountCredentials
import os
from oauth2client import client
from oauth2client import tools
from oauth2client.file import Storage
import csv
from datetime import datetime
from pprint import pprint
import json
import re
from statistics import mean
from collections import OrderedDict

DATA_COLS = [
    'Avg-ResTime',
    'Avg-ProcTime',
    'Throughput',
    'Bandwidth',
    'Succ-Ratio'
    ]

SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://spreadsheets.google.com/feeds'
    ]

STAGES = [
    'read',
    'write',
    'mixed'
]

CLIENT_SECRET_FILE = 'service_account.json'
APPLICATION_NAME = 'Google Sheets API Python'
SPREADSHEET_ID = os.environ.get('COSBENCH_SPREADSHEET_ID', 'notarealspreadsheet')
SERVICE_ACCOUNT = json.loads(os.environ.get('COSBENCH_NIGHTLY_SERVICE_ACCOUNT', 'notarealserviceaccount'))
DATA_WRKST = 'Data'

def get_credentials():
    """Gets valid user credentials from storage.

    If nothing has been stored, or if the stored credentials are invalid,
    the OAuth2 flow is completed to obtain the new credentials.

    Returns:
        Credentials, the obtained credential.
    """
    return ServiceAccountCredentials.from_json_keyfile_dict(SERVICE_ACCOUNT, scopes = SCOPES)

def login():
    gc = gspread.authorize(get_credentials())
    spreadsheet = gc.open_by_key(SPREADSHEET_ID)
    return spreadsheet

def load_csv(filename):
    with open(filename) as f:
        for row in csv.DictReader(f):
            yield row

def to_num(x):
    try:
        return int(x)
    except ValueError:
        pass
    try:
        return float(x)
    except:
        return x

stage_num = re.compile(r's[0-9]+-')
def parse_row(row):
    stage = stage_num.sub('', row['Stage'])
    stage_type = row['Op-Type']
    if stage_type in STAGES:
        filtered = OrderedDict(filter(lambda r: r[0] in DATA_COLS, row.items()))
        filtered['Succ-Ratio'] = filtered['Succ-Ratio'].replace('%', '')
        parsed = OrderedDict(map(lambda r: (r[0], to_num(r[1])), filtered.items()))
        parsed['Stage'] = stage
        return parsed

def filter_data(rows):
    data = []
    for row in rows:
        parsed = parse_row(row)
        if parsed:
            data.append(parsed)
    return data

def collapse_mixed(rows):
    skip = False
    for x, row in enumerate(rows):
        if 'mixed' in row['Stage'] and not skip:
            collapsed = {k: mean((row[k], rows[x+1][k])) for k in DATA_COLS}
            collapsed['Stage'] = row['Stage']
            skip = True
            yield collapsed
        else:
            if skip:
                skip = False
            else:
                yield row

def parse_data(filename):
    for row in collapse_mixed(filter_data(load_csv(filename))):
        yield row


if __name__ == '__main__':
    spreadsheet = login()
    stages = {k: [] for k in DATA_COLS}
    headers = {k: [] for k in DATA_COLS}
    wrks = spreadsheet.worksheet(DATA_WRKST)
    for row in parse_data('workload.csv'):
        stage = row.pop('Stage')
        for k, v in row.items():
            headers[k].append(stage)
            stages[k].append(v)

    values = [datetime.now().strftime("%m/%d/%Y")]
    h = ['Data']
    for k in DATA_COLS:
        values += stages[k]
        h += headers[k]
    # wrks.append_row(h, 'USER_ENTERED')
    wrks.append_row(values, 'USER_ENTERED')
