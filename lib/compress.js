'use strict'

var request = require('request');
var pathLib = require('path');
var fs = require('fs');
var tool = require('./common');

var dns = require('dns');

var isOA = false;

dns.resolve('www.oa.com', function(err, address) {
	if(!err){

		var innerIPReg = /(^10\.|^172\.|^192.)/;

		if (innerIPReg.test(address[0])) {
			isOA = true;
		}
	}
});


function compress(config, filePath, toPath, cb) {	

	var isExists = fs.existsSync('./.tmp');

	if(!isExists) {
		fs.mkdirSync('./.tmp');
	}	

	tool.uploadFile(config, filePath, toPath, function(destPath) {

		var destPath = '.tmp/'+pathLib.basename(filePath);
		var folder = config.folder;	

		if(folder && folder.indexOf('/') != 0) {
			folder = '/' + folder;
		}	

		var req;
		var picURL = 'http://'+config.bucketname+'-'+config.appid+'.pic'+config.region+'.myqcloud.com'+folder+toPath+'?imageView2/q/70';

		if(!isOA) {
			req = request(picURL);
		}else {
			var _req = request.defaults({'proxy':'http://dev-proxy.oa.com:8080'});
			req = _req(picURL);
		}
		
		req.on('response', function() {
			var ws = fs.createWriteStream(destPath);
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
