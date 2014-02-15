
mongoose = require 'mongoose'
_ = require 'underscore'

Inbox 	= mongoose.model 'Inbox'
Follow 	= mongoose.model 'Follow'
Post 	= mongoose.model 'Post'

ObjectId = mongoose.Types.ObjectId

# Schema
UserSchema = new mongoose.Schema {
	name:			String
	username: 		String
	tags:			Array
	facebookId:		String
	accessToken:	String

	notifiable:		{ type: Boolean, default: true }
	lastUpdate:		{ type: Date, default: Date(0) }
	firstAccess: 	Date
	
	contact: {
		email: 		String
	}
	
	portfolio: {
		fullName: 	''
		birthday: 	Date
		city: 		''
		avatarUrl: 	''
	},

	badges: 		[]
	followingTags: 	[]
}, { id: true } # default

# Virtuals
UserSchema.virtual('avatarUrl').get ->
	'https://graph.facebook.com/'+@facebookId+'/picture'

UserSchema.virtual('profileUrl').get ->
	'/p/'+@username

################################################################################
## related to Following

UserSchema.methods.getFollowers = (cb) ->
	Follow.find {followee: @id}, (err, docs) ->
		console.log('found follow relationships:',  _.pluck(docs, 'follower'))
		User.find {_id: {$in: _.pluck(docs, 'follower')}}, (err, docs) ->
			# console.log('found:', err, docs)
			cb(err, docs)

UserSchema.methods.getFollowing = (cb) ->
	Follow.find {follower: @id}, (err, docs) ->
		User.find {_id: {$in: _.pluck(docs, 'followee')}}, (err, docs) ->
			# console.log('found:', err, docs)
			cb(err, docs)

UserSchema.methods.countFollowers = (cb) ->
	Follow.count {followee: @id}, (err, count) ->
		cb(err, count)

UserSchema.methods.doesFollowId = (userId, cb) ->
	if not userId
		cb(true)
	Follow.findOne {followee:userId, follower:@id},
		(err, doc) ->
			cb(err, !!doc)

#### Actions

UserSchema.methods.followId = (userId, cb) ->
	if not userId
		cb(true)
	Follow.findOneAndUpdate {follower:@.id, followee:userId},
		{},
		{upsert: true},
		(err, doc) ->
			console.log("Now following:", err, doc)
			cb(err, !!doc)

UserSchema.methods.unfollowId = (userId, cb) ->
	Follow.findOneAndRemove {follower:@id, followee:userId},
		(err, doc) ->
			console.log("Now unfollowing:", err, doc)
			cb(err, !!doc)

################################################################################
## related to the Timeline and Inboxes

UserSchema.methods.getTimeline = (opts, cb) ->
	Inbox
		.find {recipient: @id}
		.sort '-dateSent'
		.populate 'post'
		.select 'post'
		.limit opts.limit or 10
		.skip opts.skip or null
 		.exec (err, inboxes) ->
 			if err then return cb(err)
 			User.populate inboxes, {path:'post.author'}, (err, docs) ->
 				cb(err, _.pluck(docs, 'post'))


UserSchema.statics.getPostsFromUser = (userId, opts, cb) ->
	# Inbox.getUserPosts @, opts, (err, docs) ->
	Post
		.find {author: userId, parentPost: null}
		.sort '-dateCreated'
		.populate 'author'
		.limit opts.limit or 10
		.skip opts.skip or null
		.exec (err, posts) ->
			console.log('posts', posts)
			cb(err, posts)

UserSchema.statics.getPostsToUser = (userId, opts, cb) ->
	# Inbox.getUserPosts @, opts, (err, docs) ->
	Post
		.find {author: userId, parentPost: null}
		.sort '-dateCreated'
		.populate 'author'
		.exec (err, posts) ->
			console.log('posts', posts)
			cb(err, posts)

###
Generate stuffed profile for the controller.
###
UserSchema.statics.genProfileFromUsername = (username, cb) ->
	User.findOne {username: username}, (err, doc) ->
		if err or not doc then return cb(err)
		unless doc then return cb(null, doc)
		doc.getFollowers (err, followers) ->
			if err then return cb(err)
			doc.getFollowing (err, following) ->
				if err then return cb(err)
				cb(null, _.extend(doc, {followers:followers, following:following}))

UserSchema.statics.genProfileFromModel = (userModel, cb) ->
	userModel.getFollowers (err, followers) ->
		if err then return cb(err)
		userModel.getFollowing (err, following) ->
			if err then return cb(err)
			cb(null, _.extend(userModel, {followers:followers, following:following}))


###
Create a post object with type comment.
###
UserSchema.methods.commentToPost = (parentPost, data, cb) ->
	# Detect repeated posts and comments
	post = new Post {
		author: @
		group: null
		data: {
			body: data.content.body
		},
		parentPost: parentPost
		postType: Post.PostTypes.Comment or data
	}
	# cb(true)
	post.save cb

###
Create a post object and fan out through inboxes.
###
UserSchema.methods.createPost = (data, cb) ->
	post = new Post {
		author: @id
		group: null
		data: {
			title: data.content.title
			body: data.content.body
		},
		# parentPost: '52fd556aee90f63350000001'
	}

	post.save (err, post) =>
			console.log('yes, here', err, post)
			# use asunc.parallel to run a job
			# Callback now, what happens later doesn't concern the user.
			cb(err, post)
			# Iter through followers and fill inboxes.
			@getFollowers (err, docs) =>
				Inbox.create {
					author: @id,
					recipient: @id,
					post: post,
				}, () -> ;

				for follower in docs
					# Inbox.createFromPost
					Inbox.create {
						author: @id,
						recipient: follower.id,
						post: post,
					}, () -> ;

UserSchema.statics.findOrCreate = require('./lib/findOrCreate')

module.exports = User = mongoose.model "User", UserSchema