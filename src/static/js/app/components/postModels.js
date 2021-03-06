
/*
** postModels.js
** Copyright QILabs.org
** BSD License
** by @f03lipe
*/

define(['jquery', 'backbone', 'underscore', 'react'], function ($, Backbone, _, React) {

	var GenericPostItem = Backbone.Model.extend({
		url: function () {
			return this.get('apiPath');
		},
		constructor: function () {
			Backbone.Model.apply(this, arguments);
			if (this.get('votes')) {
				this.liked = !!~this.get('votes').indexOf(user.id);
			}
		}
	});

	var PostItem = GenericPostItem.extend({
		url: function () {
			return this.get('apiPath');
		},

		handleToggleVote: function () {
			var self = this;
			$.ajax({
				type: 'post',
				dataType: 'json',
				url: this.get('apiPath')+(this.liked?'/unupvote':'/upvote'),
			}).done(function (response) {
				console.log('response', response);
				if (!response.error) {
					self.liked = !self.liked;
					if (response.data.author) {
						delete response.data.author;
					}
					self.set(response.data);
					self.trigger('change');
				}
			});
		},

		initialize: function () {
			var children = this.get('children') || {};
			this.children = {};
			this.children.Answer = new ChildrenCollections.Answer(children.Answer);
			this.children.Comment = new ChildrenCollections.Comment(children.Comment);
		},
	});

	var PostList = Backbone.Collection.extend({
		model: PostItem,

		constructor: function (models, options) {
			Backbone.Collection.apply(this, arguments);
			this.url = options.url || app.postsRoot || '/api/me/timeline/posts';
			this.EOF = false;
			this.on('remove', function () {
				console.log('removed!');
			});
		},
		comparator: function (i) {
			return -1*new Date(i.get('published'));
		},
		parse: function (response, options) {
			if (response.minDate < 1) {
				this.EOF = true;
				this.trigger('statusChange');
			}
			this.minDate = 1*new Date(response.minDate);
			var data = Backbone.Collection.prototype.parse.call(this, response.data, options);
			// Filter for non-null results.
			return _.filter(data, function (i) { return !!i; });
		},
		tryFetchMore: function () {
			if (this.minDate < 1) {
				return;
			}
			this.fetch({data: {maxDate:this.minDate-1}, remove:false});
		},
	});

	var CommentItem = GenericPostItem.extend({});

	var AnswerItem = PostItem.extend({});

	var ChildrenCollections = {
		Answer: Backbone.Collection.extend({
			model: AnswerItem,	
			comparator: function (i) {
				// do votes here! :)
				return -i.get('voteSum');
			},
			comparators: {
				'votes': function (i) {
					return -i.get('voteSum');
				},
				'older': function (i) {
					return 1*new Date(i.get('published'));
				},
				'younger': function (i) {
					return -1*new Date(i.get('published'));
				},
				'updated': function (i) {
					return -1*new Date(i.get('updated'));
				}
			},
		}),
		Comment: Backbone.Collection.extend({
			model: CommentItem,
			endDate: new Date(),
			comparator: function (i) {
				return 1*new Date(i.get('published'));
			},
			url: function () {
				return this.postItem.get('apiPath') + '/comments'; 
			},
			parse: function (response, options) {
				this.endDate = new Date(response.endDate);
				return Backbone.Collection.prototype.parse.call(this, response.data, options);
			}
		}),
	};

	return {
		postItem: PostItem,
		answerItem: AnswerItem,
		commentItem: CommentItem,
		postList: PostList,
	}
});