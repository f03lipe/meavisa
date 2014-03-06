
# src/models/notification
# Copyright QILabs.org
# by @f03lipe

mongoose = require 'mongoose'
async = require 'async'
_ = require 'underscore'
assert = require 'assert'

assertArgs = require './lib/assertArgs'
hookedModel = require './lib/hookedModel'

Types =
	PostComment: 'PostComment'
	PostAnswer: 'PostAnswer'
	NewFollower: 'NewFollower'
	UpvotedAnswer: 'UpvotedAnswer'
	SharedPost: 'SharedPost'

# Think internationalization!

MsgTemplates = 
	PostComment: '<%= agentName %> comentou na sua publicação.'
	NewFollower: '<%= agentName %> começou a te seguir.'

MsgHtmlTemplates = 
	PostComment: '<strong><%= agentName %></strong> comentou na sua publicação.'
	NewFollower: '<strong><%= agentName %></strong> começou a te seguir.'

################################################################################
## Schema ######################################################################

NotificationSchema = new mongoose.Schema {
	agent:		 	{ type:mongoose.Schema.ObjectId, ref:'User', required:true }
	agentName:	 	{ type:String }
	recipient:	 	{ type:mongoose.Schema.ObjectId, ref:'User', required:true, index:1 }
	dateSent:		{ type:Date, index:1 }
	type:			{ type:String, required:true }
	seen:			{ type:Boolean, default:false }
	accessed:		{ type:Boolean, default:false }
	url:			{ type:String }
	
	group:			{ type:mongoose.Schema.ObjectId, ref:'Group', required:false }
	resources:		[{ type: mongoose.Schema.ObjectId }] # used to delete when resources go down
	thumbnailUrl:	{ type:String, required:false}
}, {
	toObject:	{ virtuals: true }
	toJSON: 	{ virtuals: true }
}

################################################################################
## Virtuals ####################################################################

NotificationSchema.virtual('msg').get ->
	if MsgTemplates[@type]
		return _.template(MsgTemplates[@type], @)
	console.warn "No template found for notification of type"+@type
	return "Notificação "+@type

NotificationSchema.virtual('msgHtml').get ->
	if MsgHtmlTemplates[@type]
		return _.template(MsgHtmlTemplates[@type], @)
	else if MsgTemplates[@type]
		return _.template(MsgTemplates[@type], @)
	console.warn "No html template found for notification of type"+@type
	return "Notificação "+@type

################################################################################
## Middlewares #################################################################

NotificationSchema.pre 'save', (next) ->
	@dateSent ?= new Date()
	next()

################################################################################
## Statics #####################################################################

notifyUser = (recpObj, agentObj, data, cb) ->
	assertArgs({ismodel:'User'},{ismodel:'User'},{contains:['url','type']}, arguments)
	
	User = mongoose.model 'User'

	note = new Notification {
		agent: agentObj
		agentName: agentObj.name
		recipient: recpObj
		type: data.type
		url: data.url
		thumbnailUrl: data.thumbnailUrl or agentObj.avatarUrl
	}
	if data.resources then note.resources = data.resources 
	note.save (err, doc) ->
		cb?(err,doc)

NotificationSchema.statics.Trigger = (agentObj, type) ->
	User = mongoose.model 'User'

	switch type
		when Types.PostComment
			return (commentObj, parentPostObj, cb) ->
				cb ?= ->
				if ''+parentPostObj.author is ''+agentObj.id
					return cb(false)
				parentPostAuthorId = parentPostObj.author
				# Find author of parent post and notify him.
				User.findOne {_id: parentPostAuthorId}, (err, parentPostAuthor) ->
					if parentPostAuthor and not err
						notifyUser parentPostAuthor, agentObj, {
							type: Types.PostComment
							url: commentObj.path
							resources: [parentPostObj.id, commentObj.id]
						}, cb
					else
						console.warn("err: #{err} or parentPostAuthor (id:#{parentPostAuthorId}) not found")
						cb(true)
		when Types.NewFollower
			return (followerObj, followeeObj, cb) ->
				# assert
				cb ?= ->
				# Find and delete older notifications from the same follower.
				Notification.findOne {
					type:Types.NewFollower,
					agent:followerObj,
					recipient:followeeObj
					}, (err, doc) ->
						if doc #
							doc.remove(()->)
						notifyUser followeeObj, followerObj, {
							type: Types.NewFollower
							url: followerObj.profileUrl
							# resources: []
						}, cb		


NotificationSchema.statics.Types = Types

module.exports = Notification = hookedModel "Notification", NotificationSchema