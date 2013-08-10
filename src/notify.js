// Generated by CoffeeScript 1.6.3
(function() {
  var User, api, e, models, mongoUri, mongoose, notifyUpdates, onGetPosts, _;

  _ = require('underscore');

  api = require('./api.js');

  models = require('./models/models.js');

  User = models.User;

  onGetPosts = function(posts, callback) {
    return User.find({}, function(err, users) {
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
          console.log(msg);
          api.sendNotification(user.facebookId, msg);
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
  };

  notifyUpdates = function(callback) {
    var blog;
    blog = api.getBlog('meavisa.tumblr.com');
    return blog.posts({
      limit: -1
    }, (function(err, data) {
      if (err) {
        if (typeof callback === "function") {
          callback(err);
        }
      }
      return onGetPosts(data.posts, callback);
    }));
  };

  if (module === require.main) {
    try {
      require('./env.js');
    } catch (_error) {
      e = _error;
    }
    mongoose = require('mongoose');
    mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/madb';
    mongoose.connect(mongoUri);
    notifyUpdates(function() {
      return mongoose.connection.close();
    });
  } else {
    exports.notifyNewPosts = notifyUpdates;
  }

}).call(this);
