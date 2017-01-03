'use strict'

var fs = require('fs');
var _ = require('lodash');
var pathLib = require('path');
var CWD = process.cwd();

/**
 * 全局配置
 * @type {Object}
 * appDir [String] 小程序项目目录，默认./app
 * uploadFileSuffix [Array] 上传的图片后缀名，默认jpg, png, gif
 * uploadFileBlackList [Path or File] 指定不上传的文件或者路径，不支持正则 
 * compress [Boolean] 上传的图片是否使用优图的压缩功能，默认false
 * cos [Object] 查看https://www.qcloud.com/document/product/436/6066
 */

var _defaultConfig = {
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
        "appid": "",
        "bucketname": "",
        "folder": "",
        "region": "",
        "secret_key": "",
        "secret_id": ""
    }
};

var configPath = pathLib.join(CWD, 'wecos.config.json');
var exists = fs.existsSync(configPath);
if (!exists) {
    throw('need file wecos.config.json');
}


var content = fs.readFileSync(configPath).toString();
try {
    var userConfig = JSON.parse(content)
} catch (e) {
    throw('wecos.config.json is not JSON format!');
}


var config = _.extend({}, _defaultConfig, userConfig);

var appDir = pathLib.join(CWD, config.appDir);
var appDirExists = fs.existsSync(appDir);
if (!appDirExists) {
    throw('appDir is not exist');
}
if (!config.cos) {
    throw('option "cos" need in config!');
}
var cosOptionNeed = ['appid', 'bucketname', 'region', 'secret_key', 'secret_id'];
for (var i = 0; i < cosOptionNeed.length; i++) {
    if (!config.cos[cosOptionNeed[i]]) {
        throw('option "cos.' + cosOptionNeed[i] + '" need in config!');
    }
}

module.exports = config;