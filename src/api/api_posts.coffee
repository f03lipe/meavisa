
mongoose = require 'mongoose'
required = require '../lib/required.js'

Resource = mongoose.model 'Resource'

_ = require 'underscore'

User = Resource.model 'User'
Post = Resource.model 'Post'

##

defaultSanitizerOptions = {
	# To be added: 'pre', 'caption', 'hr', 'code', 'strike', 
	allowedTags: ['h1','h2','b','em','strong','a','img','u','ul','li', 'blockquote', 'p', 'br', 'i'], 
	allowedAttributes: {
		'a': ['href'],
		'img': ['src'],
	},
	# selfClosing: [ 'img', 'br', 'hr', 'area', 'base', 'basefont', 'input', 'link', 'meta' ],
	selfClosing: ['img', 'br'],
	# transformTags: {
	# 	'div': 'span',
	# },
	exclusiveFilter: (frame) ->
		return frame.tag in ['a','span'] and not frame.text.trim()
}

sanitizerOptions = {
	'question': _.extend({}, defaultSanitizerOptions, {
		allowedTags: ['b','em','strong','a','u','ul','blockquote','p','img','br','i','li'],
	}),
	'tip': defaultSanitizerOptions,
	'experience': defaultSanitizerOptions,
	'answer': _.extend({}, defaultSanitizerOptions, {
		allowedTags: ['b','em','strong','a','u','ul','blockquote','p','img','br','i','li'],
	}),
}

sanitizeBody = (body, type) ->
	sanitizer = require 'sanitize-html'
	getSanitizerOptions = (type) ->
		switch type
			when Post.Types.Question
				return _.extend({}, defaultSanitizerOptions, {
					allowedTags: ['b','em','strong','a','u','ul','blockquote','p','img','br','i','li'],
				})
			when Post.Types.Tip
				return defaultSanitizerOptions
			when Post.Types.Experience
				return defaultSanitizerOptions
			when Post.Types.Answer
				return _.extend({}, defaultSanitizerOptions, {
					allowedTags: ['b','em','strong','a','u','ul','blockquote','p','img','br','i','li'],
				})
		return defaultSanitizerOptions
	return sanitizer(body, getSanitizerOptions(type))

######

checks = {
	contentExists: (content, res) ->
		if not content
			res.status(500).endJson({error:true, message:'Ops.'})
			return null
		return content

	tags: (_tags, res) ->
		# Sanitize tags
		if not _tags or not _tags instanceof Array
			res.status(400).endJson(error:true, message:'Selecione pelo menos um assunto relacionado a esse post.')
			return null
		tags = (tag for tag in _tags when tag in _.keys(res.app.locals.getTagMap()))
		if tags.length == 0
			res.status(400).endJson(error:true, message:'Selecione pelo menos um assunto relacionado a esse post.')
			return null
		return tags

	title: (title, res) ->
		if not title or not title.length
			res.status(400).endJson({
				error:true,
				message:'Erro! Cadê o título da sua '+res.app.locals.postTypes[req.body.type.toLowerCase()].translated+'?',
			})
			return null
		if title.length < 10
			res.status(400).endJson({
				error:true,
				message:'Hm... Esse título é muito pequeno. Escreva um com no mínimo 10 caracteres, ok?'
			})
			return null
		if title.length > 100
			res.status(400).endJson({
				error:true,
				message:'Hmm... esse título é muito grande. Escreva um com até 100 caracteres.'
			})
			return null
		return title

	body: (body, res, max_length=20*1000) ->
		if not body
			res.status(400).endJson({error:true, message:'Escreva um corpo para a sua publicação.'})
			return null

		if body.length > max_length
			res.status(400).endJson({error:true, message:'Erro! Texto muito grande.'})
			return null

		return body

	type: (type, res) ->
		if not type.toLowerCase() in _.keys(res.app.locals.postTypes)
			return res.status(400).endJson(error:true, msg:'Tipo de publicação inválido.')
		# Camelcasify the type
		return type[0].toUpperCase()+type.slice(1).toLowerCase()
}


module.exports = {

	permissions: [required.login],

	post: (req, res) ->
		data = req.body

		return unless content = checks.contentExists(req.body.content, res)
		return unless type = checks.type(req.body.type, res)
		return unless title = checks.title(content.title, res)
		return unless tags = checks.tags(req.body.tags, res)
		return unless _body = checks.body(content.body, res)
		body = sanitizeBody(_body, type)

		req.user.createPost {
			type: type,
			tags: tags,
			content: {
				title: title,
				body: body,
			}
		}, req.handleErrResult((doc) ->
			doc.populate 'author', (err, doc) ->
				res.endJson doc
		)

	children: {
		'/:id': {

			get: (req, res) ->
					return unless postId = req.paramToObjectId('id')
					Post.findOne { _id:postId }, req.handleErrResult((post) ->
						post.stuff req.handleErrResult (stuffedPost) ->
							res.endJson( data: stuffedPost )
					)

			put: [required.posts.selfOwns('id'),
				(req, res) ->
					return if not postId = req.paramToObjectId('id')
					Post.findById postId, req.handleErrResult (post) =>

						return unless content = checks.contentExists(req.body.content, res)

						console.log "first", content,"\n"

						if post.parentPost
							if post.type is 'Answer'
								return unless _body = checks.body(content.body, res)
								post.content.body = sanitizeBody(_body, post.type)
							else
								# Prevent edition of comments.
								return res.endJson {error:true, msg:''}
						else
							return unless content.title = checks.title(content.title, res)
							return unless post.tags = checks.tags(req.body.tags, res)
							return unless _body = checks.body(content.body, res)
							content.body = sanitizeBody(_body, post.type)

						console.log "final", content
						_.extend(post.content, content)

						post.save req.handleErrResult((me) ->
							console.log('oi', me)
							post.stuff req.handleErrResult (stuffedPost) ->
								res.endJson stuffedPost
						)
				]

			delete: [required.posts.selfOwns('id'), (req, res) ->
				return if not postId = req.paramToObjectId('id')
				Post.findOne {_id: postId, author: req.user},
					req.handleErrResult (doc) ->
						if doc.type not in ['Answer','Comment']
							req.user.update {$inc:{'stats.posts':-1}},()->
								console.log(arguments)
						doc.remove()
						res.endJson(doc)
				]

			children: {
				'/upvote':
					# post: [required.posts.selfCanComment('id'),
					post: [required.posts.selfDoesntOwn('id'), (req, res) ->
						return if not postId = req.paramToObjectId('id')
						Post.findById postId, req.handleErrResult (post) =>
							req.user.upvotePost post, (err, doc) ->
								res.endJson { error: err, data: doc }
					]
				'/unupvote':
					post: [required.posts.selfDoesntOwn('id'), (req, res) ->
						return if not postId = req.paramToObjectId('id')
						Post.findById postId, req.handleErrResult (post) =>
							req.user.unupvotePost post, (err, doc) ->
								res.endJson { error: err, data: doc }
					]
				'/comments':
					get: [required.posts.selfCanSee('id'), (req, res) ->
						return if not postId = req.paramToObjectId('id')
						Post.findById postId
							.populate 'author'
							.exec req.handleErrResult (post) ->
								post.getComments req.handleErrResult((comments) =>
									res.endJson {
										data: comments
										error: false
										page: -1 # sending all
									}
								)
					]
					post: [required.posts.selfCanComment('id'), (req, res) ->
						return if not postId = req.paramToObjectId('id')
						htmlEntities = (str) ->
							String(str)
								.replace(/&/g, '&amp;')
								.replace(/</g, '&lt;')
								.replace(/>/g, '&gt;')
								.replace(/"/g, '&quot;')

						if req.body.content.body.length > 1000
							return res.status(400).endJson({error:true,message:'Esse comentário é muito grande.'})
						if req.body.content.body.length < 3
							return res.status(400).endJson({error:true,message:'Esse comentário é muito pequeno.'})

						data = {
							content: {
								body: htmlEntities(req.body.content.body)
							}
							type: Post.Types.Comment
						}

						Post.findById postId, req.handleErrResult (parentPost) =>
							req.user.postToParentPost parentPost, data,
								req.handleErrResult (doc) =>
									doc.populate('author',
										req.handleErrResult (doc) =>
											res.endJson(error:false, data:doc)
									)
					]
				'/answers':
					post: [required.posts.selfCanComment('id'), (req, res) ->
						return unless postId = req.paramToObjectId('id')
						Post.findById postId,
							req.handleErrResult (parentPost) =>

								return unless content = checks.contentExists(req.body.content, res)
								console.log('oi')
								return unless _body = checks.body(content.body, res)
								postBody = sanitizeBody(_body, Post.Types.Answer)
								data = {
									content: {
										body: postBody
									}
									type: Post.Types.Answer
								}

								console.log 'final data:', data
								req.user.postToParentPost parentPost, data,
									req.handleErrResult (doc) =>
										doc.populate('author',
											req.handleErrResult (doc) =>
												res.endJson doc
										)
					]

			}
		},
	},
}