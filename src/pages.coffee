
# pages.coffee
# for QILabs.org
# BSD License

mongoose = require 'mongoose'
util = require 'util'

required = require './lib/required'

Resource = mongoose.model 'Resource'

Post 	= Resource.model 'Post'
User 	= Resource.model 'User'

module.exports = {
	'/':
		name: 'index'
		get: (req, res, next) ->
			if req.user
				req.user.lastUpdate = new Date()
				res.render 'pages/main',
					user_profile: req.user
				req.user.save()
			else
				res.render 'pages/front'

	'/entrar':
		get: (req, res) ->
			res.redirect('/auth/facebook')

	'/settings':
		name: 'settings'
		permissions: [required.login]
		get: (req, res) ->
			res.render 'pages/settings', {}

	'/tags/:tagId':
		permissions: [required.login]
		get: (req, res) ->
			# req.user.genProfile (err, profile) ->
			# 	req.user.doesFollowUser req.user, (err, bool) ->
			res.render 'pages/tag',
				profile: req.user
				follows: bool

	'/u/:username':
		name: 'profile'
		get: [required.login,
			(req, res) ->
				unless req.params.username
					return res.render404()
				User.findOne {username:req.params.username},
					req.handleErrResult (pUser) ->
						pUser.genProfile (err, profile) ->
							if err or not profile
								# req.logMe "err generating profile", err
								return res.render404()
							req.user.doesFollowUser pUser, (err, bool) ->
								res.render 'pages/profile', 
									profile: profile
									follows: bool
			]

	'/posts/:postId':
		name: 'profile'
		# slugs: {post:'postId'}
		# permissions: [required.posts.selfCanSee('post')]
		permissions: [required.login]
		get: (req, res) ->
			# if req.user
			# 	res.redirect('/#posts/'+req.params.postId)
			return unless postId = req.paramToObjectId('postId')
			Post.findOne { _id:postId }, req.handleErrResult((post) ->
				if post.parentPost
					return res.render404()
					console.log 'redirecting', post.path
					return res.redirect(post.path)
				else
					post.stuff req.handleErrResult (stuffedPost) ->
						res.render 'pages/blogPost.html', {
							post: stuffedPost,
						}
				)

	'/posts/:postId/edit':
		permissions: [required.login]
		get: (req, res) ->
			res.redirect('/#posts/'+req.params.postId+'/edit')

	'/equipe':
		name: 'team',
		get: (req, res) ->
			res.render('pages/about_pages/team')

	'/sobre':
		name: 'about',
		get: (req, res) ->
			res.render('pages/about_pages/about')

	'/guias': 	require './guides/controller'
	'/api': 	require './controllers/api'
	'/auth': 	require './controllers/auth'
}