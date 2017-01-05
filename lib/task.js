var fs = require('fs');
var _ = require('lodash');
var glob = require("glob");
var pathLib = require('path');
var globalConfig = require('./config');
var upload = require('./upload');

var CWD = process.cwd();
var SUFFIX = ['wxml', 'wxss'];
var APP;

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
        if (pathLib.resolve(_src) == pathLib.resolve(src)) {
            replaceList.push({
                file: pathLib.relative(APP, filepath),
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
var backupFile = function (fromPath, callback) {
    var toPath = pathLib.resolve(globalConfig.backupDir || './wecos_backup', pathLib.relative(APP, fromPath));
    var toDir = pathLib.dirname(toPath);
    var cb = function (err) {
        callback && callback(err);
    };
    var rename = function () {
        fs.readFile(fromPath, function(err, data) {
            if (err) {
                cb(err);
            } else {
                fs.writeFile(toPath, data, function(err){
                    if (err) {
                        cb(err);
                    } else {
                        if (fs.existsSync(fromPath)) {
                            fs.unlink(fromPath, cb);
                        }
                    }
                });
            }
        });
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
    APP = pathLib.join(CWD, globalConfig.appDir);
    uploadFile(filepath, function (err, url) {
        if (err) {
            callback(err);
        } else {
            dirReplaceResourceLinks(filepath, url, callback);
        }
    });
};

module.exports = resourceToCloud;