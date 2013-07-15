// Generated by CoffeeScript 1.6.3
(function() {
  var User, api, blog, blog_url, mongoUri, mongoose, onGetPosts, _;

  _ = require('underscore');

  api = require('./apis.js');

  mongoose = require('mongoose');

  User = require('./models/user.js');

  blog_url = 'http://meavisa.tumblr.com';

  blog = api.getBlog("meavisa.tumblr.com");

  mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/madb';

  mongoose.connect(mongoUri);

  onGetPosts = function(posts, callback) {
    return User.find({}, function(err, users) {
      var notSaved, tags, user, _i, _len, _results;
      notSaved = users.length;
      _results = [];
      for (_i = 0, _len = users.length; _i < _len; _i++) {
        user = users[_i];
        tags = _.union.apply(null, _.pluck(_.filter(posts, function(post) {
          return new Date(post.date) > new Date(user.lastUpdate);
        }), 'tags'));
        if (tags.length) {
          api.sendNotification(user.facebookId, "We have updated on some of the tags you are following: " + tags.join(', '));
        }
        user.lastUpdate = new Date();
        _results.push(user.save(function(e) {
          notSaved -= 1;
          if (notSaved === 0) {
            return typeof callback === "function" ? callback() : void 0;
          }
        }));
      }
      return _results;
    });
  };

  blog.posts(function(err, data) {
    if (err) {
      throw err;
    }
    return onGetPosts(data.posts, function() {
      return mongoose.connection.close();
    });
  });

}).call(this);
