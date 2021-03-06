
mongoose = require 'mongoose'
required = require '../lib/required.js'

Resource = mongoose.model 'Resource'

User = Resource.model 'User'
Post = Resource.model 'Post'
Inbox = mongoose.model 'Inbox'
Follow = Resource.model 'Follow'
Activity = Resource.model 'Activity'
Notification = mongoose.model 'Notification'

module.exports = {
	permissions: [required.isMe]
	methods: {
		get: (req, res) ->
			# This be ugly but me don't care.
			console.log req.query
			if req.query.user?
				User.find {}, (err, docs) ->
					res.endJson { users:docs }
			if req.query.activity?
				Activity.find {}
					.populate 'actor'
					.exec (err, docs) ->
						res.endJson { activities:docs }
			else if req.query.inbox?
				Inbox.find {}
					.populate 'resource'
					.exec (err, inboxs) ->
						res.endJson { err:err, inboxs:inboxs } 
			else if req.query.notification?
				Notification.find {}, (err, notifics) ->
					res.endJson { notifics:notifics } 
			else if req.query.post?
				Post.find {}, (err, posts) ->
					res.endJson { posts:posts } 
			else if req.query.follow?
				Follow.find {}, (err, follows) ->
					res.endJson { follows:follows } 
			else if req.query.note?
					res.endJson { notes:notes }
			else if req.query.session?
				res.endJson { ip: req.ip, session: req.session } 
				Activity.find {}, (err, notes) ->
			else
				# This could be much better with icedcoffeescript
				User.find {}, (err, users) ->
					Post.find {}, (err, posts) ->
						Inbox.find {}, (err, inboxs) ->
							Follow.find {}, (err, follows) ->
								Notification.find {}, (err, notifics) ->
									Activity.find {}, (err, notes) ->
										obj =
											ip: req.ip
											inboxs: inboxs
											notifics: notifics
											session: req.session
											users: users
											posts: posts
											follows: follows
											notes: notes
										res.endJson obj
	}
}