'use strict'

//鉴权
//上传
//压缩
var fs = require('fs');
var pathLib = require('path');
var globalConfig = require('./config');
var compress = require('./compress');
var tool = require('./common');

//鉴权
var config = {
	region: globalConfig.cos.region,
	appid: globalConfig.cos.appid,
	bucketname: globalConfig.cos.bucketname,
	folder: globalConfig.cos.folder,
	secret_id: globalConfig.cos.secret_id,
	secret_key: globalConfig.cos.secret_key,
	compress: globalConfig.compress,
	backupFileDir: globalConfig.backupFileDir
};

//上传
function upload(fromPath,toPath,cb) {
		
	var isExists = fs.existsSync(fromPath);

	if(!isExists) {
		cb('FILE NOT EXISTS');
		return;
	}

	if(config.compress) {		
		compress(config, fromPath, toPath, function(destPath) {				
			tool.uploadFile(config, destPath, toPath, cb);
		});
	}else {
		tool.uploadFile(config, fromPath, toPath, cb);
	}
	
}

module.exports = upload;

