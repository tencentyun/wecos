var path = require('path');
var upload = require('../lib/upload');

upload(path.join(__dirname, 'test.png'), '/test.jpg', function(res) {
	console.log(res);
});
