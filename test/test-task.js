var resourceToCloud = require('../task');

var CWD = __dirname;
resourceToCloud([
    path.join(CWD, 'app/images/logo.png'),
    path.join(CWD, 'app/images/camera.png'),
    path.join(CWD, 'app/images/qr.png')
], function () {
    console.log('cloud finished!');
});