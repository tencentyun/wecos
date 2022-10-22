'use strict'

var fs = require('fs');
var globalConfig = require('./config');
var pkg = require('../package');
var COS = require('cos-nodejs-sdk-v5');
var qiniu = require("qiniu");

var tool = {
    uploadFile: globalConfig.ossType == 'qnos' ?
        qnUploadFile
        :
        globalConfig.ossType == 'cos' ?
            txUploadFile
            :
            undefined
};

var cos = new COS({
    UserAgent: 'cos-wecos-' + pkg.version,
});

function getFolder() {
    if (!process.env.APP_ENV) {
        return 'default/';
    }
    var folder = 'default';
    if (process.env.APP_ENV === 'dev') {
        folder = globalConfig.devFolder.trim();
    } else if (process.env.APP_ENV === 'pro') {
        folder = globalConfig.proFolder.trim();
    } else {
        folder = globalConfig.devFolder.trim();
    }
    if (folder.endsWith('/')) {
        return folder;
    }
    return folder + '/';
}

// 腾讯云上传
function txUploadFile(_config, fromPath, toPath, cb) {
    cos.options.SecretId = globalConfig.cos.secret_id;
    cos.options.SecretKey = globalConfig.cos.secret_key;
    var cosFolder = getFolder();
    var opt = {
        Bucket: globalConfig.cos.bucket || (globalConfig.cos.bucketname + '-' + globalConfig.cos.appid),
        Region: globalConfig.cos.region,
    };
    toPath=toPath.replace(/\\/g,"/");
    opt.Key = cosFolder + toPath;
    opt.Body = fs.createReadStream(fromPath);
    opt.ContentLength = fs.statSync(fromPath).size;
    cos.putObject(opt, function (err, data) {
        opt.Sign = false;
        var url = cos.getObjectUrl(opt);
        cb && cb(err, url);
    });
}

// 七牛云上传
function qnUploadFile(_config, fromPath, toPath, cb) {

    var accessKey = globalConfig.qnos.ACCESS_KEY;
    var secretKey = globalConfig.qnos.SECRET_KEY;
    var bucket = globalConfig.qnos.bucketname;
    var publicBucketDomain = globalConfig.qnos.publicBucketDomain;
    var mac = new qiniu.auth.digest.Mac(accessKey, secretKey);
    var options = { scope: bucket };
    var config = new qiniu.conf.Config();
    var bucketManager = new qiniu.rs.BucketManager(mac, config);
    var putPolicy = new qiniu.rs.PutPolicy(options);
    var uploadToken = putPolicy.uploadToken(mac);
    var formUploader = new qiniu.form_up.FormUploader(config);
    var putExtra = new qiniu.form_up.PutExtra();
    var qnosFolder = getFolder();
    var getObjectUrl = async function (publicDownloadUrl) {
        return { Url: publicDownloadUrl };
    }
    toPath = toPath.replace(/\\/g, "/");
    //上传到七牛后保存的文件名
    var key = qnosFolder + toPath;
    var rs = fs.createReadStream(fromPath);
    formUploader.putStream(uploadToken, key, rs, putExtra,
        function (err, respBody, _respInfo) {
            var publicDownloadUrl = bucketManager.publicDownloadUrl(publicBucketDomain, respBody.key);
            cb && cb(err, getObjectUrl(publicDownloadUrl));
        });
}

module.exports = tool;
