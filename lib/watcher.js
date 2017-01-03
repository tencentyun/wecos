'use strict'

/* global require */
var pathLib = require('path');
var chokidar = require('chokidar');
var _ = require('lodash');
var ora = require('ora');
var globalConfig = require('./config');
var resourceToCloud = require('./task');
var CWD = process.cwd();


var appDir = joinPath(globalConfig.appDir);
var uploadSuffix = globalConfig.uploadFileSuffix;
uploadSuffix = _.isArray(uploadSuffix) ? uploadSuffix : [uploadSuffix];
var uploadBlackList = globalConfig.uploadFileBlackList;

var watchList = _.map(uploadSuffix, function(item) {
    return pathLib.join(appDir, '**/*' + item)
})
uploadBlackList = _.isArray(uploadBlackList) ? uploadBlackList : [uploadBlackList];



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

function watchFile() {

    // var watchPath = [];

    // function handle(filepath, stat) {

    //     if( pathLib.extname(filepath) 
    //         && globalConfig['uploadFileSuffix'].indexOf(pathLib.extname(filepath)) > -1
    //     ) {
    //         var isBlackList = false;


    //         // uploadFileBlackList.forEach(function(item) {
    //         //     var reg = new RegExp(joinPath(item));
    //         //     console.log('reg', reg)
    //         //     console.log('filepath', filepath)
    //         //     console.log('res', reg.test(filepath))
    //         //     if(reg.test(filepath)) {
    //         //         isBlackList = true
    //         //         return false
    //         //     }
    //         // })

    //         if(!isBlackList) {
    //             filepath = relativePath(process.cwd(), filepath)

    //             resourceToCloud(filepath, function(err) {
    //                 if(err) return console.log(err);

    //                 console.log(filepath + ' 已传上cos');

    //             })
    //         }
    //     }
    // }
    
    // watch.createMonitor(appDir, {
    //     interval: 1
    // },function (monitor) {
        
    //     monitor.on("created", handle)
    //     monitor.on("changed", handle)

    // });
    

    console.log('/***** 【微信cos瘦身工具】 start watching  *****/');
    console.log('/***** 【Listening App path】 ' + appDir + '  *****/');

    chokidar.watch(watchList, {
        ignored: uploadBlackList,
        cwd: CWD
    })
    .on('all', function(event, filepath) {
        if(_.includes(['add', 'change'], event)) {
            filepath = relativePath(CWD, filepath)

            var spinner = ora('upload: ' +  filepath).start();

            resourceToCloud(filepath, function(err) {
                if(err) {
                    spinner.fail()
                    console.log('Error:', err)
                    return 
                }

                // console.log(filepath + ' 已传上cos');
                spinner.succeed();

            })
        }
    })

}

module.exports = watchFile;
if (!module.parent) {
    watchFile()
    console.log('watching!');
}