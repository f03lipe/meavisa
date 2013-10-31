
# api.coffee
# for meavisa.org, by @f03lipe

tumblr	= require 'tumblr'
request = require 'request'
_ = require 'underscore'

User = require './models/user.js'

# Assumes app.js was run (and possibly updated process.env).
	
sendNotification = (user_id, template, callback) ->
	access_token = process.env.facebook_access_token
	url =  "https://graph.facebook.com/#{user_id}/notifications?access_token=#{access_token}&template=#{encodeURIComponent(template)}"
	request.post url,
		(error, response, body) ->
			console.log "Notification request to #{url} response:", body, error
			callback?(error, response, body)

getBlog = (blogurl) ->
	return new tumblr.Tumblr(blogurl, process.env.tumblr_ock)

pushBlogTags = (blog, callback) ->
	blog.posts (err, data) ->
		if err then return callback?(err, [])
		tags = _.chain(data.posts)
				.pluck('tags')
				.reduceRight(((a, b) -> a.concat(b)), [])
				.value();
		callback?(null, tags)

getPostsWithTags = (blog, tags, callback) ->
	# Get tumblr posts.
	blog.posts({ limit: -1 }, (err, data) ->
		if err then return callback?(err)
		_posts = []
		data.posts.forEach (post) ->
			int = _.intersection(post.tags, tags)
			if int[0]
				_posts.push(post)
		callback?(null, _posts)
	)

# Notifies users of new posts with the tags that they follow.
notifyNewPosts = (callback) ->
	blog = getBlog('meavisa.tumblr.com')
	onGetTPosts = ((posts) ->
		onGetUsers = ((users) ->
			numUsersNotSaved = users.length
			for user in users when user.notifiable # when user.facebookId is process.env.facebook_me
				tags = _.union.apply(null,
							_.pluck \
								_.filter(posts, (post) ->
									return new Date(post.date) > new Date(user.lastUpdate)
							), 'tags')

				if tags.length
					msg = "We have updates on some of the tags you are following: "+tags.slice(0,2).join(', ')+' and more!'
					sendNotification user.facebookId, msg
					console.log("To #{user.name}: #{msg}")
				else
					console.log "No updates for #{user.name}."
				user.lastUpdate = new Date()
				user.save (e) ->
					numUsersNotSaved -= 1
					if numUsersNotSaved == 0
						callback?()
			if users.length is 0
				console.log('No users to notify. Quitting.')
				callback(null, [])
		)
		User.find {}, (err, users) ->
			if err then callback?(err)
			onGetUsers(users)
	)

	# Get tumblr posts.
	blog.posts { limit: -1 }, (err, data) ->
		if err then callback?(err)
		onGetTPosts(data.posts)


module.exports = exports = {
	sendNotification: sendNotification
	getBlog: getBlog
	pushBlogTags: pushBlogTags
	getPostsWithTags: getPostsWithTags
	notifyNewPosts: notifyNewPosts
}