'use strict'

var request = require('request');
var pathLib = require('path');
var fs = require('fs');
var tool = require('./common');

function compress(config, filePath, toPath, cb) {	

	var isExists = fs.existsSync('./.tmp');

	if(!isExists) {
		fs.mkdirSync('./.tmp');
	}	

	tool.uploadFile(config, filePath, '/'+ pathLib.basename(filePath), function(destPath) {

		var destPath = '.tmp/'+pathLib.basename(filePath);
		var folder = config.folder;	

		if(folder && folder.indexOf('/') != 0) {
			folder = '/' + folder;
		}

		var ws = fs.createWriteStream(destPath);	

		var req = request('http://'+config.bucketname+'-'+config.appid+'.pic'+config.region+'.myqcloud.com'+folder+'/'+pathLib.basename(filePath)+'?imageView2/q/70',{timeout:1000});

		req.on('response', function() {
			req.pipe(ws);
			ws.on('close', function() {				
				cb(destPath);
			});
		}).on('error', function(err) {				
			cb(err);
		});				
	});
}

module.exports = compress;
