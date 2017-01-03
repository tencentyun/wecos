#!/usr/bin/env node
'use strict';

var pkg = require('../package.json');
var hasArg = false;
process.argv.slice(1).filter(function (arg) {
    var match = arg.match(/^--?([a-z][0-9a-z-]*)(?:=(.*))?$/i);
    if (match) {
        arg = match[1];
    } else {
        return arg;
    }

    switch (arg) {
        case 'v':
        case 'version':
            hasArg = true;
            console.log('wecos ' + pkg.version);
            break;
    }
});

if (!hasArg) {
    var watchTask = require('../lib/watcher');
    watchTask();
}