'use strict'

//鉴权
//上传
//压缩
var fs = require('fs');
var pathLib = require('path');
var _ = require('lodash');
var globalConfig = require('./config');
var compress = require('./compress');
var tool = require('./common');

//上传
function upload(fromPath,toPath,cb) {
		
	var isExists = fs.existsSync(fromPath);

	if(!isExists) {
		cb('FILE NOT EXISTS');
		return;
	}

	if(globalConfig.compress) {		
		compress(globalConfig.cos, fromPath, toPath, function(destPath) {
			if(!_.isString(destPath)) {
				var err = destPath;
				cb(err);
			}else {
				tool.uploadFile(globalConfig.cos, destPath, toPath, cb);
			}			
		});
	}else {
		tool.uploadFile(globalConfig.cos, fromPath, toPath, cb);
	}
	
}

module.exports = upload;

