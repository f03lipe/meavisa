
module.exports = function(err, req, res, next) {

	if (err.type === 'ObsoleteId') {
		return res.render404("Esse usuário não existe.");
	}

	console.error('Error stack:', err);
	console.trace();
	
	if (err.status) {
		res.status(err.status);
	}
	if (res.statusCode < 400) {
		res.status(500);
	}

	var accept = req.headers.accept || '';

	if (req.app.get('env') === 'production') {
		if (~accept.indexOf('html')) {
			res.render('pages/500', {
				user: req.user,
				message: err.human_message
			});
		} else {
			var error = { message: err.message, stack: err.stack };
			for (var prop in err) error[prop] = err[prop];
			res
				.set('Content-Type', 'application/json')
				.end(JSON.stringify({ error: error }));
		}
	} else {
		if (~accept.indexOf('html')) {
			if (err.permission = 'login') {
				res.redirect('/');
			}

			res.render('pages/500', {
				user: req.user,
				error_code: res.statusCode,
				error_msg: err,
				error_stack: (err.stack || '').split('\n').slice(1).join('<br>'),
			});
		} else if (~accept.indexOf('json')) {
			var error = { message: err.message, stack: err.stack };
			for (var prop in err) error[prop] = err[prop];
			var json = JSON.stringify({ error: error });
			res.setHeader('Content-Type', 'application/json');
			res.end(json);
		} else { // plain text
			res.writeHead(res.statusCode, { 'Content-Type': 'text/plain' });
			res.end(err.stack);
		}
	}

}