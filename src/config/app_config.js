var path = require('path');
var srcDir = path.dirname(module.parent.filename);

module.exports = function (app) {
	app.config = {
		appRoot: srcDir,
		staticUrl: '/static/',
		staticRoot: path.join(srcDir, 'static'),
		mediaUrl: '/media/',
		mediaRoot: path.join(srcDir, 'media'),
		viewsRoot: path.join(srcDir, 'views'),
	};
};