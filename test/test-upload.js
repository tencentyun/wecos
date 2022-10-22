var path = require('path');
var upload = require('../lib/upload');

upload(path.join(__dirname, 'test.jpg'), 'test.jpg', async function(res, url) {
	console.log((await url).Url);
});
