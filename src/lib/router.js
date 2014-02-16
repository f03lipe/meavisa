
/* router.js
** for qilabs.org, by @f03lipe
**
** Route an object with many pages.
**
** Usage:
** routePages({
**    'path': {
**        name: 'name', // Optional, to be used with app.locals.getPageUrl
**        permissions: [required.login,] // Decorators to attach to all children
**        methods: {
**            get: function (req, res) { ... }
**            ...
**        },
**        children: { ... } // same structure, but with relative paths
**    }
** });
*/

module.exports = function Router (app) {

	var joinPath = require('path').join.bind(require('path'));

	function routePath (path, name, routerNode, permissions) {
		// TODO: prevent overriding urls with different paths.
		app.locals.urls[name] = path;
		var httpMethods = routerNode.methods;
		
		// Use app[get/post/put/...] to route methods in routerNode.methods
		for (var method in httpMethods)
		if (httpMethods.hasOwnProperty(method)) {
			var calls = httpMethods[method];
			// Call app[method] with arguments (path, *permissions, *calls)
			app[method].apply(app, [path].concat(permissions||[]).concat(calls));
		}
		var HTTP_METHODS = ['get', 'post', 'delete', 'put'];
		for (var i=0; i<HTTP_METHODS.length; i++) {
			var method = HTTP_METHODS[i];
			if (routerNode[method]) {
				var calls = routerNode[method];
				app[method].apply(app, [path].concat(permissions||[]).concat(calls));
			}
		}
	}

	function routeChildren(parentPath, childs, permissions) {
		if (!childs) return {};
		// Type-check just to make sure.
		permissions = permissions || [];
		console.assert(permissions instanceof Array);

		for (var relpath in childs)
		if (childs.hasOwnProperty(relpath)) {
			// Join with parent's path to get abspath.
			var abspath = joinPath(parentPath, relpath);
			// Name is self-assigned or path with dashed instead of slashes.
			var name = childs[relpath].name || abspath.replace('/','_');
			// Permissions are parent's + child's ones 
			var newPermissions = permissions.concat(childs[relpath].permissions || []);
			routePath(abspath, name, childs[relpath], newPermissions);
			routeChildren(abspath, childs[relpath].children, newPermissions);
		}
	}

	return function (object) {

		for (var path in object) if (object.hasOwnProperty(path)) {
			if (object[path].methods)
				routePath(path, object[path].name, object[path].methods);
			routeChildren(path, object[path].children);
		}
	}
}