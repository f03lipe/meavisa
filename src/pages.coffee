
# pages.coffee
# for qilabs.org

mongoose = require 'mongoose'
required = require './lib/required'

Post 	= mongoose.model 'Post'
Inbox 	= mongoose.model 'Inbox'
Tag 	= mongoose.model 'Tag'
User 	= mongoose.model 'User'
Subscriber = mongoose.model 'Subscriber'

module.exports = {
	'/':
		name: 'index'
		methods: {
			get: (req, res) ->
				if req.user
					req.user.lastUpdate = new Date()
					req.user.save()
					User.genProfileFromModel req.user, (err, profile) ->
						res.render 'pages/timeline',
							user_profile: profile
				else
					User.find()
						.sort({'_id': 'descending'})
						.limit(10)
						.find((err, data) ->
							res.render 'pages/frontpage',
								latestSignIns: data
							)

			post: (req, res) ->
				# Redirect from frame inside Facebook
				res.end('<html><head></head><body><script type="text/javascript">'+
						'window.top.location="http://meavisa.herokuapp.com"</script>'+
						'</body></html>')
		}

	'/feed':
		name: 'feed'
		methods: {
			get: [required.login, (req, res) ->
				# console.log('logged:', req.user.name, req.user.tags)
				req.user.lastUpdate = new Date()
				req.user.save()
				Tag.getAll (err, tags) ->
					res.render 'pages/feed',
						tags: JSON.stringify(Tag.checkFollowed(tags, req.user.tags))
			],
			post: (req, res) ->
				# Redirect from frame inside Facebook?
				res.end('<html><head></head><body><script type="text/javascript">'+
						'window.top.location="http://meavisa.herokuapp.com"</script>'+
						'</body></html>')
		}

	'/painel':
		name: 'panel'
		methods: {
			get: [required.login, (req, res) ->
				res.render('pages/panel', {})
			]
		}

	'/lab/:groupSlug':
		name: 'profile'
		methods: {
			get: (req, res) ->
				if not req.params.groupSlug
					return res.redirect('/404')
				Group.genGroupProfileFromSlug req.params.groupSlug,
					(err, profile) ->
						if err or not profile
							return res.redirect('/404')
						console.log('profile', err, profile)
						req.user.doesFollowId profile.id, (err, bool) ->
							res.render 'pages/profile', 
								profile: profile
								follows: bool
		}

	'/p/:user':
		name: 'profile'
		methods: {
			get: (req, res) ->
				if not req.params.user
					return res.render404()
				User.genProfileFromUsername req.params.user,
					(err, profile) ->
						if err or not profile
							return res.render404()
						console.log('profile', err, profile)
						req.user.doesFollowId profile.id, (err, bool) ->
							res.render 'pages/profile', 
								profile: profile
								follows: bool
		}

	'/post/:postId':
		name: 'profile'
		methods: {
			get: (req, res) ->
		}
		children: {
			'/edit':
				methods:
					get: (req, res) ->
		}

	'/404':
		name: '404'
		methods: {
			get: (res, req) ->
				res.render404()
		}

	'/sobre': 	require './controllers/about'
	'/api': 	require './controllers/api'
	'/auth': 	require './controllers/auth'
}