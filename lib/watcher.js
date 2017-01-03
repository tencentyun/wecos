'use strict'

/* global require */
var pathLib = require('path');
var chokidar = require('chokidar');
var _ = require('lodash');
var ora = require('ora');
var glob = require('glob');
var globalConfig = require('./config');
var resourceToCloud = require('./task');
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

function runFileTask(filepath) {
    filepath = relativePath(CWD, filepath);
    var spinner = ora('upload: ' +  filepath).start();
    resourceToCloud(filepath, function(err) {
        if(err) {
            spinner.fail()
            console.log('Error:', err);
            return
        }
        // console.log(filepath + ' 已传上cos');
        spinner.succeed();
    })
}

function watchFile(option) {

    globalConfig.init(option);

    var appDir = joinPath(globalConfig.appDir);
    var uploadSuffix = globalConfig.uploadFileSuffix;
    uploadSuffix = _.isArray(uploadSuffix) ? uploadSuffix : [uploadSuffix];
    var uploadBlackList = globalConfig.uploadFileBlackList;

    var watchList = _.map(uploadSuffix, function(item) {
        return pathLib.join(appDir, '**/*' + item);
    });
    uploadBlackList = _.isArray(uploadBlackList) ? uploadBlackList : [uploadBlackList];

    glob('{' + watchList.join(',') + '}', function (er, files) {
        files.forEach(function (filepath) {
            runFileTask(filepath);
        });
    });

    if (globalConfig.watch) {
        console.log('/***** 【微信cos瘦身工具】 start watching  *****/');
        console.log('/***** 【Listening App path】 ' + appDir + '  *****/');
        chokidar.watch(watchList, {
            ignored: uploadBlackList,
            persistence: globalConfig.watch,
            cwd: CWD
        }).on('all', function(event, filepath) {
            if(_.includes(['add', 'change'], event)) {
                runFileTask(filepath);
            }
        })
    }

}

module.exports = watchFile;
if (!module.parent) {
    watchFile()
    console.log('watching!');
}