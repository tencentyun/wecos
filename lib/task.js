var fs = require('fs');
var _ = require('lodash');
var glob = require("glob");
var pathLib = require('path');
var globalConfig = require('./config');
var upload = require('./upload');

var CWD = process.cwd();
var APP = pathLib.join(CWD, globalConfig.appDir);
var SUFFIX = ['wxml', 'wxss'];

// 替换文件内的资源文件
var fileReplaceResourceLinks = function (filepath, src, url) {
    var content = fs.readFileSync(filepath).toString();
    var oldContent = content;
    var m;
    var relUrls = [];
    var regex = /<image.*?src=['|"](.*?)['|"]/g;
    while (m = regex.exec(content)) {
        m[1].indexOf('{') === -1 && relUrls.push(m[1]);
    }
    var replaceList = [];
    relUrls.forEach(function (relUrl) {
        var _src = relUrl.substr(0, 1) === '/' ? pathLib.join(APP, relUrl) : pathLib.resolve(pathLib.dirname(filepath), relUrl);
        if (_src == src) {
            console.log(pathLib.relative(APP, filepath), relUrl, url);
            replaceList.push({
                file: path.relative(APP, filepath),
                from: relUrl,
                to: url
            });
            var reg = new RegExp('<image.*?src=[\'|"]' + relUrl + '[\'|"]', 'g');
            content = content.replace(reg, '<image src="' + url + '"');
        }
    });
    if (oldContent !== content) {
        fs.writeFileSync(filepath, content);
    }
    return replaceList;
};

// 扫描所有文件，替换成新的链接
var dirReplaceResourceLinks = function (src, url, callback) {
    glob(pathLib.join(APP, '/**/*') + '.{' + SUFFIX.join(',') + '}', function (er, files) {
        var replaceList = [];
        files.forEach( function (filepath){
            if (SUFFIX.indexOf(filepath.split('.').pop()) === -1) return;
            var rList = fileReplaceResourceLinks(filepath, src, url);
            replaceList = _.concat(replaceList, rList);
        });
        callback && callback(null, replaceList);
    });
};

var deepMkdir = function(dirpath, callback) {
    var exists = fs.existsSync(dirpath);
    if(!exists) {
        deepMkdir(pathLib.dirname(dirpath), callback);
        fs.mkdirSync(dirpath, callback);
    }
};

//先备份源文件
var backupFile = function (fromPath) {
    var toPath = pathLib.resolve(globalConfig.backupDir || './wecos_backup', pathLib.relative(APP, fromPath));
    var toDir = pathLib.dirname(toPath);
    var rename = function () {
        if (fs.existsSync(fromPath)) {
            fs.rename(fromPath, toPath);
        }
    };
    if (!fs.existsSync(toDir)) {
        deepMkdir(toDir, rename);
    } else {
        rename();
    }
};

// 上传文件
var uploadFile = (function () {
    var count = 0;
    var taskQueue = [];
    // 最多 5 个并发上传任务
    var next = function () {
        if (count > 5 || !taskQueue.length) return;
        ++count;
        var task = taskQueue.shift();
        var localPath = pathLib.relative(CWD, task.filepath);
        var remotePath = pathLib.relative(APP, task.filepath).replace(pathLib.sep, '/');
        upload(localPath, remotePath, function (err, url) {
            if (!err) backupFile(task.filepath);
            task.callback && task.callback(err, url);
            --count;
            next();
        });
    };

    return function (filepath, callback) {
        taskQueue.push({
            filepath: filepath,
            callback: callback
        });
        next();
    };
})();

// 处理静态文件
var resourceToCloud = function (filepath, callback) {
    if (fs.existsSync(filepath)) {
        uploadFile(filepath, function (err, url) {
            if (err) {
                callback(err);
            } else {
                dirReplaceResourceLinks(filepath, url, callback);
            }
        });
    } else {
        callback('FILE NOT EXIST', []);
    }
};

module.exports = resourceToCloud;