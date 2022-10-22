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
 * watch [Boolean] 是否实时监听，默认true
 * compress [Boolean] 上传的图片是否使用优图的压缩功能，默认false
 * cos [Object] 查看https://www.qcloud.com/document/product/436/6066
 */

var _defaultConfig = {
    "appDir": "./app",
    "backupDir": "./wecos_backup",
    "uploadFileSuffix": [".jpg", ".png", ".gif"],
    "uploadFileBlackList": [],
    "replaceHost": "",
    "targetHost": "",
    "compress": false,
    "watch": true,
    "devFolder": "",
    "proFolder": "",
    "ossType": '',
    "qnos": {
        "ACCESS_KEY": "",
        "SECRET_KEY": "",
        "bucketname": "",
        "publicBucketDomain": ""
    },
    "cos": {
        "secret_id": "",
        "secret_key": "",
        "appid": "",
        "bucketname": "",
        "bucket": "",
        "region": "",
    }
};

function initByOption(option) {
    _.assignIn(config, option)
}

function initByFile(configPath) {
    var exists = fs.existsSync(configPath);
    if (!exists) {
        throw('need file wecos.config.json');
    }
    var content = fs.readFileSync(configPath).toString();
    try {
        var userConfig = (new Function('return (' + content + ')'))();
    } catch (e) {
        throw('wecos.config.json is not JSON format!');
    }
    _.assignIn(config, userConfig);
    var appDir = pathLib.join(CWD, config.appDir);
    var appDirExists = fs.existsSync(appDir);
    if (!appDirExists) {
        throw('appDir is not exist');
    }
    if (!userConfig.cos) {
        throw('option "cos" need in config!');
    }
    if (userConfig.replaceHost && !userConfig.targetHost) {
        throw('option "targetHost" need in config!');
    }
    var cosOptionNeed = ['region', 'secret_key', 'secret_id'];
    for (var i = 0; i < cosOptionNeed.length; i++) {
        if (!userConfig.cos[cosOptionNeed[i]]) {
            throw('option "cos.' + cosOptionNeed[i] + '" need in config!');
        }
    }
    if (!(userConfig.cos.bucket || (userConfig.cos.bucketname && userConfig.cos.appid))) {
        throw('option "cos.bucket" need in config! format as "test-1251902136"');
    }
}

var config = _.assign(_defaultConfig);

config.init = function(option){
    if (!option) {
        option = pathLib.join(CWD, 'wecos.config.json');
    }
    if(_.isString(option)){
        initByFile(option)
    }else if(_.isObject(option)) {
        initByOption(option)
    }
    if (!config.cos.bucket && config.cos.bucket && config.cos.appid) {
        config.cos.bucket = config.cos.bucketname + '-' + config.cos.appid;
    }
    if (config.cos.bucket && !(config.cos.bucket || config.cos.appid)) {
        var lastIndex = config.cos.bucket.lastIndexOf('')
        config.cos.bucketname = config.cos.bucket.substr(0, lastIndex)
        config.cos.appid = config.cos.bucket.substr(lastIndex + 1)
    }
}

config.init();

module.exports = config;


