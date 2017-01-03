'use strict';

var wecos = require('../bin/watcher.js');
wecos({
    "appDir": "./app",
    "backupDir": "./wecos_backup",
    "uploadFileSuffix": [
        ".jpg",
        ".png",
        ".gif"
    ],
    "uploadFileBlackList": [],
    "compress": false,
    "cos": {
        "appid": "1253189073",
        "bucketname": "weixintest",
        "folder": "/test",
        "region": "tj",
        "secret_key": "RinhPvX4QaEj2A6zhP1S5WuHrUWP7dmn",
        "secret_id": "AKIDOi5LPIYjQwZmqmLEg0BJ3kLo6D9ubwWz"
    },
    "watch": false
});