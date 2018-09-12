'use strict'

var fs = require('fs');
var globalConfig = require('./config');
var pkg = require('../package');
var COS = require('cos-nodejs-sdk-v5');

var tool = {
	uploadFile: uploadFile
};

var cos = new COS({
    UserAgent: 'cos-wecos-' + pkg.version,
});
function uploadFile(_config, fromPath, toPath, cb) {
    cos.options.SecretId = globalConfig.cos.secret_id;
    cos.options.SecretKey = globalConfig.cos.secret_key;

    // 桶里的文件夹
    var cosFolder = globalConfig.cos.folder || '/';
    if (cosFolder.substr(-1, 1) !== '/') {
      cosFolder = cosFolder + '/'
    }

    var opt = {
        Bucket: globalConfig.cos.bucket || (globalConfig.cos.bucketname + '-' + globalConfig.cos.appid),
        Region: globalConfig.cos.region,
    };
    opt.Key = cosFolder + toPath;
    opt.Body = fs.createReadStream(fromPath);
    opt.ContentLength = fs.statSync(fromPath).size;
    cos.putObject(opt, function (err, data) {
        opt.Sign = false;
        var url = cos.getObjectUrl(opt);
        cb && cb(err, url);
    });
}

module.exports = tool;
