'use strict'

var formstream = require('formstream');
var crypto = require('crypto');
var http = require('http');
var fs = require('fs');
var pak = require('../package.json');

var tool = {
	getAuth: getAuth,
	uploadFile: uploadFile
}

function getAuth(config) {

	var now = parseInt(Date.now() / 1000);
    var rdm = parseInt(Math.random() * Math.pow(2, 32));
    
    var expired = 0;    
    var fileid = '/'+config.appid+'/'+config.bucketname+'/';
    var folder = config.folder;
    if(folder) {
    	if(folder.indexOf('/') == 0) {
    		folder = folder.substr(folder.indexOf('/')+1);
    	}
    	fileid += folder;
    }

    fileid = encodeURIComponent(fileid);

    var plainText = 'a='+config.appid+'&k='+config.secret_id+'&e='+expired+'&t='+now+'&r='+rdm+'&f='+fileid+'&b='+config.bucketname;
    
    var data = new Buffer(plainText,'utf8');
    
    var resStr = crypto.createHmac('sha1',config.secret_key).update(data).digest();
    
    var bin = Buffer.concat([resStr,data]);
    
    var sign = bin.toString('base64');

    return sign;

}

function uploadFile(_config, fromPath, toPath, cb) {
	
	var stats = fs.statSync(fromPath);	
	var fileSizeInBytes = stats["size"];	

	var form = formstream().field('op', 'upload').field('insertOnly',0);

	form.file('filecontent', fromPath, fileSizeInBytes);

	var headers = form.headers();
	headers['Authorization'] = getAuth(_config);
	headers['User-Agent'] = 'cos-wecos-'+pak.version;

	var folder = _config.folder;

	if(folder && folder.indexOf('/') != 0) {
		folder = '/' + folder;
	}

	if(toPath.indexOf('/') != 0) {
		toPath = '/' + toPath;
	}

	var options = {
		host: _config.region + '.file.myqcloud.com',		
        path: '/files/v2/'+_config.appid+'/'+_config.bucketname+(folder ? folder : '') + encodeURIComponent(toPath),
        method: 'POST',        
        headers: headers
	};

	var req = http.request(options, function(res) {				
		
		var body = '';

		res.on('data', function (chunk) {			
			body += chunk;	
		}).on('end', function() {			
			var ret = JSON.parse(body);
			if(ret.code == 0){
				var surl = ret.data.source_url;				
				cb(null, surl);
			}else {
				cb(ret.message);
			}					
		}).on('err', function(err) {
			cb(err);
		})

	});	

	form.pipe(req);	
}	

module.exports = tool;