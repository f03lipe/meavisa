var Post, Resource, Tag, User, mongoose, required;

mongoose = require('mongoose');

required = require('../lib/required.js');

Resource = mongoose.model('Resource');

User = mongoose.model('User');

Post = Resource.model('Post');

Tag = mongoose.model('Tag');

module.exports = {
  permissions: [required.login],
  children: {
    '/:id': {
      get: function(req, res) {
        var postId;
        if (!(postId = req.paramToObjectId('id'))) {
          return;
        }
        return Post.findOne({
          _id: postId
        }, req.handleErrResult((function(_this) {
          return function(doc) {
            return doc.fillComments(function(err, object) {
              return res.endJson({
                error: false,
                data: object
              });
            });
          };
        })(this)));
      },
      post: function(req, res) {
        var postId;
        if (!(postId = req.paramToObjectId('id'))) {

        }
      },
      "delete": function(req, res) {
        var postId;
        if (!(postId = req.paramToObjectId('id'))) {
          return;
        }
        return Post.findOne({
          _id: postId,
          author: req.user
        }, req.handleErrResult(function(doc) {
          Inbod.remove({
            resource: doc
          }, (function(_this) {
            return function(err, num) {};
          })(this));
          doc.remove();
          return res.endJson(doc);
        }));
      },
      children: {
        '/comments': {
          methods: {
            get: [
              required.posts.userCanSee('id'), function(req, res) {
                var postId;
                if (!(postId = req.paramToObjectId('id'))) {
                  return;
                }
                return Post.findById(postId).populate('author').exec(req.handleErrResult(function(post) {
                  return post.getComments(req.handleErrResult((function(_this) {
                    return function(comments) {
                      return res.endJson({
                        data: comments,
                        error: false,
                        page: -1
                      });
                    };
                  })(this)));
                }));
              }
            ],
            post: [
              required.posts.userCanComment('id'), function(req, res) {
                var data, postId;
                if (!(postId = req.paramToObjectId('id'))) {
                  return;
                }
                data = {
                  content: {
                    body: req.body.content.body
                  }
                };
                return Post.findById(postId, req.handleErrResult((function(_this) {
                  return function(parentPost) {
                    return req.user.commentToPost(parentPost, data, req.handleErrResult(function(doc) {
                      return doc.populate('author', req.handleErrResult(function(doc) {
                        return res.endJson({
                          error: false,
                          data: doc
                        });
                      }));
                    }));
                  };
                })(this)));
              }
            ]
          }
        }
      }
    }
  }
};