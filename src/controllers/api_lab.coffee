
# src/controllers/api_lab
# Copyright QILabs.org
# by @f03lipe

###
The controller for /api/labs/* calls.
###

###
GUIDELINES for development:
- Keep controllers sanitized ALWAYS.
- Never pass request parameters or data to schema methods, always validate
  before. Use res.paramToObjectId to get create ids:
  `(req, res) -> return unless userId = res.paramToObjectId('userId'); ...`
- Prefer no not handle creation/modification of documents. Leave those to
  schemas statics and methods.
###

################################################################################
################################################################################

mongoose = require 'mongoose'
_ = require 'underscore'
ObjectId = mongoose.Types.ObjectId

required = require '../lib/required.js'

Group = mongoose.model 'Group'
User = mongoose.model 'User'

HandleErrResult = (res) ->
	(cb) ->
		(err, result) ->
			if err
				res.status(400).endJson(error:true)
			else if not result
				res.status(404).endJson(error:true, name:404)
			else
				cb.apply(cb, [].splice.call(arguments,1))

# Starts at /api/labs 
module.exports = {
	permissions: [required.login],
	post: (req, res) ->
		req.user.createGroup {
				profile: {
					name: req.body.name
				}
			}, (err, doc) ->
				if err
					req.flash('err', err)
					res.redirect('/labs/create') if err
					return
				res.redirect('/labs/'+doc.id)
	children:
		':labId/posts': {
			permissions: [required.labs.userCanAccess('labId')],
			get: (req, res) ->
				return unless labId = req.paramToObjectId('labId')
				Group.findOne {_id: labId},
					HandleErrResult(res)((group) ->

						opts = {limit:10}
						if parseInt(req.query.page)
							opts.maxDate = parseInt(req.query.maxDate)

						req.user.getLabPosts opts, group,
							HandleErrResult(res)((docs) ->

								if docs.length is opts.limit
									minDate = docs[docs.length-1].dateCreated.valueOf()
								else
									minDate = -1
						
								res.endJson {
									data: docs
									error:false
									minDate: minDate
								}
							)
					)
			post: (req, res) ->
				return unless groupId = req.paramToObjectId('labId')
				req.user.createPost {
					groupId: groupId
					content:
						title: 'My conquest!'+Math.floor(Math.random()*100)
						body: req.body.content.body
				}, HandleErrResult(res)((doc) ->
					doc.populate 'author', (err, doc) ->
						res.endJson {error:false, data:doc}
					)
		}
		':labId/addUser/:userId': {
			permissions: [required.labs.userCanAccess('labId')],
			name: 'ApiLabAddUser'
			post: (req, res) ->
				return unless labId = req.paramToObjectId('labId')
				return unless userId = req.paramToObjectId('userId')
				Group.findOne {_id: labId}, HandleErrResult(res)((group) ->
					User.findOne {_id: userId}, HandleErrResult(res)((user) ->
						type = Group.Membership.Types.Member
						req.user.addUserToGroup(user, group, type,
							(err, membership) ->
								# console.log('what?', err, membership)
								res.endJson {
									error: !!err,
									membership: membership
								}
						)
					)
				)
		}
}