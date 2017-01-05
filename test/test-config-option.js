'use strict';

var wecos = require('../lib/watcher.js');
wecos({
    "appDir": "./app",
    "backupDir": "./wecos_backup",
    "uploadFileSuffix": [".jpg", ".png", ".gif"],
    "uploadFileBlackList": [],
    "compress": false,
    "watch": false,
    "cos": {
        "appid": "",
        "bucketname": "",
        "folder": "",
        "region": "",
        "secret_key": "",
        "secret_id": ""
    }
});