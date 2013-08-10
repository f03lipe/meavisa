// Generated by CoffeeScript 1.6.3
(function() {
  var getBlog, getPostsWithTags, notifyNewPosts, pushBlogTags, pushNewPosts, request, sendNotification, tumblr, _;

  tumblr = require('tumblr');

  request = require('request');

  _ = require('underscore');

  sendNotification = function(user_id, template, callback) {
    var access_token, url;
    access_token = process.env.facebook_access_token;
    url = "https://graph.facebook.com/" + user_id + "/notifications?access_token=" + access_token + "&template=" + (encodeURIComponent(template));
    return request.post(url, function(error, response, body) {
      console.log("Notification request to " + url + " response:", body, error);
      return typeof callback === "function" ? callback(error, response, body) : void 0;
    });
  };

  getBlog = function(blogurl) {
    return new tumblr.Tumblr(blogurl, process.env.tumblr_ock);
  };

  pushBlogTags = function(blog, callback) {
    return blog.posts(function(err, data) {
      var post, tag, tags, _i, _j, _len, _len1, _ref, _ref1;
      if (err) {
        return typeof callback === "function" ? callback(err, []) : void 0;
      }
      tags = [];
      _ref = data.posts;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        post = _ref[_i];
        _ref1 = post.tags;
        for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
          tag = _ref1[_j];
          if (tags.indexOf(tag) === -1) {
            tags.push(tag);
            console.log('pushing found tag: #' + tag);
          }
        }
      }
      return typeof callback === "function" ? callback(null, tags) : void 0;
    });
  };

  getPostsWithTags = function(blog, tags, callback) {
    return blog.posts({
      limit: -1
    }, function(err, data) {
      var _posts;
      if (err) {
        return typeof callback === "function" ? callback(err) : void 0;
      }
      _posts = [];
      data.posts.forEach(function(post) {
        var int;
        int = _.intersection(post.tags, tags);
        if (int[0]) {
          return _posts.push(post);
        }
      });
      return typeof callback === "function" ? callback(null, _posts) : void 0;
    });
  };

  notifyNewPosts = function(callback) {
    var blog, onGetTPosts;
    blog = getBlog('meavisa.tumblr.com');
    onGetTPosts = (function(posts) {
      var onGetUsers;
      onGetUsers = (function(users) {
        var msg, numUsersNotSaved, tags, user, _i, _len, _results;
        numUsersNotSaved = users.length;
        _results = [];
        for (_i = 0, _len = users.length; _i < _len; _i++) {
          user = users[_i];
          if (!(user.facebookId === process.env.facebook_me)) {
            continue;
          }
          tags = _.union.apply(null, _.pluck(_.filter(posts, function(post) {
            return new Date(post.date) > new Date(user.lastUpdate);
          }), 'tags'));
          if (tags.length) {
            msg = "We have updates on some of the tags you are following: " + tags.slice(0, 2).join(', ') + ' and more!';
            api.sendNotification(user.facebookId, msg);
            console.log("To " + user.name + ": " + msg);
          } else {
            console.log("No updates for " + user.name + ".");
          }
          user.lastUpdate = new Date();
          _results.push(user.save(function(e) {
            numUsersNotSaved -= 1;
            if (numUsersNotSaved === 0) {
              return typeof callback === "function" ? callback() : void 0;
            }
          }));
        }
        return _results;
      });
      return User.find({}, function(err, users) {
        if (err) {
          if (typeof callback === "function") {
            callback(err);
          }
        }
        return onGetUsers(users);
      });
    });
    return blog.posts({
      limit: -1
    }, function(err, data) {
      if (err) {
        if (typeof callback === "function") {
          callback(err);
        }
      }
      return onGetTPosts(data.posts);
    });
  };

  pushNewPosts = function(callback) {
    var blog, onGetTPosts;
    blog = getBlog('meavisa.tumblr.com');
    onGetTPosts = (function(posts) {
      var onGetDBPosts;
      return onGetDBPosts = (function(dbposts) {
        var newposts, post, postsNotSaved, _i, _len;
        postsNotSaved = 0;
        newposts = [];
        for (_i = 0, _len = posts.length; _i < _len; _i++) {
          post = posts[_i];
          if (!(!_.findWhere(dbposts, {
            tumblrId: post.id
          }))) {
            continue;
          }
          ++postsNotSaved;
          newposts.push(post);
          console.log("pushing new post \"" + post.title + "\"");
          Post.create({
            tumblrId: post.id,
            tags: post.tags,
            tumblrUrl: post.post_url,
            tumblrPostType: post.type,
            date: post.date
          }, (function(err, data) {
            if (err) {
              if (typeof callback === "function") {
                callback(err);
              }
            }
            if (--postsNotSaved === 0) {
              return typeof callback === "function" ? callback(null, newposts) : void 0;
            }
          }));
        }
        if (newposts.length === 0) {
          console.log('No new posts to push. Quitting.');
          return callback(null, []);
        }
      }, Post.find({}, function(err, dbposts) {
        if (err) {
          if (typeof callback === "function") {
            callback(err);
          }
        }
        return onGetDBPosts(dbposts);
      }));
    });
    return blog.posts({
      limit: -1
    }, function(err, data) {
      if (err) {
        if (typeof callback === "function") {
          callback(err);
        }
      }
      return onGetTPosts(data.posts);
    });
  };

  exports.sendNotification = sendNotification;

  exports.getBlog = getBlog;

  exports.pushBlogTags = pushBlogTags;

  exports.getPostsWithTags = getPostsWithTags;

  exports.notifyNewPosts = notifyNewPosts;

}).call(this);
