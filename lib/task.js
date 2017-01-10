var fs = require('fs');
var _ = require('lodash');
var glob = require("glob");
var pathLib = require('path');
var globalConfig = require('./config');
var upload = require('./upload');

var CWD = process.cwd();
var SUFFIX = ['wxml', 'wxss'];
var REG_PROTOCOL = /^([a-zA-Z]{2,}:)\/\//;
var REG_IMAGE_TAG = /(<image( [^>]*)? src *= *['|"])(.*?)(['|"])/g;
var REG_IMAGE_STYLE = /(background(-image)? *:[^;]*url *\( *['|"]?)(.*?)(['|"]? *\))/g;
var APP;


// 多层创建目录
var deepMkdir = function(dirpath, callback) {
    var exists = fs.existsSync(dirpath);
    if(!exists) {
        deepMkdir(pathLib.dirname(dirpath), callback);
        fs.mkdirSync(dirpath, callback);
    }
};

// 备份源文件
var backupFile = function (fromPath, callback) {
    if (globalConfig.backupDir === null || globalConfig.backupDir === '') return;
    var toPath = pathLib.resolve(globalConfig.backupDir, pathLib.relative(APP, fromPath));
    var toDir = pathLib.dirname(toPath);
    var cb = function (err) {
        callback && callback(err);
    };
    var backup = function () {
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
    if (fs.existsSync(toDir)) {
        backup();
    } else {
        deepMkdir(toDir, backup);
    }
};

// 格式化 url
var formatUrl = function (url, defaultProtocol) {
    defaultProtocol = defaultProtocol || 'http:';
    if (url.substr(0, 2) == '//') {
        url = defaultProtocol + url;
    }
    if (!REG_PROTOCOL.test(url)) {
        url = defaultProtocol + '//' + url;
    }
    return url;
};

// 替换 url 里的 host
var replaceUrlHost = function (url, fromHost, toHost) {
    if (!fromHost || !fromHost.length || !toHost || !REG_PROTOCOL.test(url)) return url;
    fromHost.forEach(function (host) {
        var match = url.match(REG_PROTOCOL);
        var protocol = match ? match[1] : 'http:';
        var formattedFromHost = formatUrl(host, protocol);
        var formattedToHost = formatUrl(toHost, protocol);
        if (url.substr(0, formattedFromHost.length) == formattedFromHost) {
            var pathname = url.substr(formattedFromHost.length);
            var sep = pathname.substr(0, 1) == '/' || formattedToHost.slice(-1) == '/' ? '/' : '';
            formattedToHost = formattedToHost.replace(/\/+$/, '');
            pathname = pathname.replace(/^\/+/, '');
            sep = !sep && pathname ? '/' : sep;
            url = formattedToHost + sep + pathname;
        }
    });
    return url;
};

// 替换文件内的资源文件
var onlineLinks = function (currentPath, resourcePath, url) {
    var content = fs.readFileSync(currentPath).toString();
    var oldContent = content;
    var replaceList = [];
    // 先替换 url
    var match = url.match(/^([a-zA-Z]{2,}:)\/\/[^/]+/);
    if (!match) return replaceList;
    if (globalConfig.targetHost) {
        url = replaceUrlHost(url, _.concat([], globalConfig.replaceHost, match && match[0]), globalConfig.targetHost);
    }
    // 找出资源链接，并替换
    content = content.replace(REG_IMAGE_TAG, function (s, m1, m2, oldUrl, m4) {
        var findResourcePath = oldUrl.substr(0, 1) === '/' ? pathLib.join(APP, oldUrl) :
            pathLib.resolve(pathLib.dirname(currentPath), oldUrl);
        if (pathLib.resolve(findResourcePath) == pathLib.resolve(resourcePath)) {
            replaceList.push({
                file: pathLib.relative(APP, currentPath),
                from: oldUrl,
                to: url
            });
            return m1 + url + m4;
        } else {
            return s;
        }
    });
    // 如果文件内容有改变，写入文件
    if (oldContent !== content) {
        fs.writeFileSync(currentPath, content);
    }
    return replaceList;
};

// 替换文件内的链接为新的 Host
var replaceLinks = function (currentPath) {
    var replaceList = [];
    var fromHost = _.isArray(globalConfig.replaceHost) ? globalConfig.replaceHost : [globalConfig.replaceHost];
    var toHost = globalConfig.targetHost;
    var content = fs.readFileSync(currentPath).toString();
    var oldContent = content;
    var _replaceM3 = function (s, m1, m2, oldUrl, m4) {
        var url = replaceUrlHost(oldUrl, fromHost, toHost);
        if (oldUrl != url) {
            replaceList.push({
                file: pathLib.relative(APP, currentPath),
                from: oldUrl,
                to: url
            });
        }
        return m1 + url + m4;
    };
    content = content.replace(REG_IMAGE_TAG, _replaceM3);
    content = content.replace(REG_IMAGE_STYLE, _replaceM3);
    // 如果文件内容有改变，写入文件
    if (oldContent !== content) {
        fs.writeFileSync(currentPath, content);
    }
    return replaceList;
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

// 扫描所有文件，替换成新的链接
var scanFiles = function (iterator, complete) {
    glob(pathLib.join(APP, '/**/*') + '.{' + SUFFIX.join(',') + '}', function (er, files) {
        var replaceList = [];
        files.forEach( function (filepath){
            if (SUFFIX.indexOf(filepath.split('.').pop()) > -1) {
                var rList = iterator(filepath);
                replaceList = _.concat(replaceList, rList);
            }
        });
        complete && complete(null, replaceList);
    });
};

// 上传资源文件并替换线上链接
exports.resourceToCloud = function (resourcePath, callback) {
    APP = pathLib.join(CWD, globalConfig.appDir);
    fs.lstat(resourcePath, function (err, stat) {
        if (stat.size > 0) {
            uploadFile(resourcePath, function (err, url) {
                if (err) {
                    callback(err);
                } else {
                    scanFiles(function (currentPath) {
                        return onlineLinks(currentPath, resourcePath, url);
                    }, callback);
                }
            });
        } else {
            callback && callback('FILE EMPTY');
        }
    });
};

// 替换资源文件的域名
exports.resourceReplaceHost = function (callback) {
    APP = pathLib.join(CWD, globalConfig.appDir);
    if (globalConfig.replaceHost && globalConfig.targetHost) {
        scanFiles(replaceLinks, callback);
    }
};

if (!module.parent) {
    exports.resourceReplaceHost();
}