'use strict'

/* global require */
var fs = require('fs');
var pathLib = require('path');
var watch = require('watch');
var _ = require('lodash');
var ora = require('ora');
var glob = require('glob');
var globalConfig = require('./config');
var task = require('./task');
var CWD = process.cwd();


function normalizePath(path) {
    path = pathLib.normalize(path);

    return path;
}

function joinPath(path) {
    var path = pathLib.join(CWD, path);

    return path;
}

function relativePath(from, to) {
    var path = pathLib.relative(from, to);

    return path;
}

function resolvePath(path) {
    var path = pathLib.resolve(path);

    return path;
}

function fixPathToUnix(path) {

    path = path.replace(/\//g, '\\');

    return path;
}

function showReplaceList(replaceList) {
    replaceList.forEach(function (item) {
        console.log('[file:' + item.file + ']', 'replace host from', '"' + item.from + '"', 'to', '"' + item.to + '"');
    });
}

var taskTimer = {};
function runFileTask(filepath, event, stat) {

    // taskTimer[filepath] && clearTimeout(taskTimer[filepath]);
    // taskTimer[filepath] = setTimeout(function () {
    //     taskTimer[filepath] = null;

        if( pathLib.extname(filepath) 
            && _.includes(globalConfig['uploadFileSuffix'], pathLib.extname(filepath))
        ) {

            var isBlackList = _.some(globalConfig.uploadFileBlackList, function(item) {
                
                if(resolvePath(item) === resolvePath(filepath)) {
                    return true
                }
                if(_.startsWith(resolvePath(filepath), resolvePath(item))) {
                    return true
                }
            })
            if(isBlackList) return;

            if (!fs.existsSync(filepath)) return;


            filepath = relativePath(CWD, filepath);

            var spinner = ora('upload: ' +  filepath).start();
            task.resourceToCloud(filepath, function(err) {
                if(err) {
                    spinner.fail();
                    console.log('Error:', err);
                    return
                }
                // console.log(filepath + ' 已传上cos');
                spinner.succeed();

                // console.log('event', event, 'filepath', filepath + ' 已传上cos');

            });

        }
    // }, 300);

}

function watchFile(option) {

    globalConfig.init(option);

    var appDir = relativePath(CWD, resolvePath(globalConfig.appDir));
    var uploadSuffix = globalConfig.uploadFileSuffix;
    uploadSuffix = _.isArray(uploadSuffix) ? uploadSuffix : [uploadSuffix];
    var watchList = _.map(uploadSuffix, function(item) {
        return pathLib.join(appDir, '**/*' + item);
    });
    var uploadBlackList = globalConfig.uploadFileBlackList;
    uploadBlackList = _.isArray(uploadBlackList) ? uploadBlackList : [uploadBlackList];
    uploadBlackList = _.map(uploadBlackList, function(item) {
        if(fs.lstatSync(resolvePath(item)).isFile()) {
            return item
        }else if(fs.lstatSync(resolvePath(item)).isDirectory()) {
            return pathLib.join(item, '**');
        }
    });

    task.resourceReplaceHost(function (err, replaceList) {
        if (!err) {
            replaceList.length && console.log('replace host finish:');
            showReplaceList(replaceList);
        }
    });

    console.log('watchList', watchList);
    console.log('uploadBlackList', uploadBlackList);

    if (globalConfig.watch) {
        console.log('/***** 【微信cos瘦身工具】 start watching *****/');
        console.log('/***** 【Listening App path】 ' + appDir + '  *****/');

        glob('{' + watchList.join(',') + '}', {
            ignore: uploadBlackList
        },function (err, files) {
            files.forEach(function (filepath) {
                runFileTask(filepath);
            });
        });

        watch.createMonitor(appDir, {
            interval: 1
        },function (monitor) {
            
            monitor.on("created", function(f, stat) {
                runFileTask(f, 'created', stat)
            })
            monitor.on("changed", function(f, stat) {
                runFileTask(f, 'changed', stat)
            })

        });
    } else {
        console.log('/***** 【微信cos瘦身工具】 start  *****/');
        console.log('/***** 【App path】 ' + appDir + '  *****/');
        glob('{' + watchList.join(',') + '}', {
            ignore: uploadBlackList
        },function (err, files) {
            files.forEach(function (filepath) {
                runFileTask(filepath);
            });
        });
    }

}

module.exports = watchFile;
if (!module.parent) {
    watchFile();
    console.log('watching!');
}
