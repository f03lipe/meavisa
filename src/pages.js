// Generated by CoffeeScript 1.6.3
(function() {
  var User, api, blog, blog_url, e, env, getPostsWithTags, posts, request, topics, _;

  _ = require('underscore');

  api = require('./apis.js');

  request = require('request');

  User = require('./models/user.js');

  try {
    env = require('./env.js');
  } catch (_error) {
    e = _error;
    env = {
      facebook: {
        app_id: process.env.facebook_app_id,
        secret: process.env.facebook_secret,
        canvas: process.env.facebook_canvas
      }
    };
  }

  blog_url = 'http://meavisa.tumblr.com';

  blog = api.getBlog("meavisa.tumblr.com");

  topics = [];

  posts = [];

  blog.posts(function(err, data) {
    if (err) {
      throw err;
    }
    return data.posts.forEach(function(post, i) {
      return post.tags.forEach(function(tag) {
        if (topics.indexOf(tag) === -1) {
          topics.push(tag);
          return console.log('pushing found tag', tag);
        }
      });
    });
  });

  getPostsWithTags = function(tags, callback) {
    return blog.posts({
      limit: -1
    }, function(err, data) {
      posts = [];
      data.posts.forEach(function(post) {
        var int;
        int = _.intersection(post.tags, tags);
        if (int[0]) {
          return posts.push(post);
        }
      });
      return callback(posts);
    });
  };

  exports.Pages = {
    index: {
      get: function(req, res) {
        if (req.user) {
          req.user.lastUpdate = new Date(0);
          req.user.save();
          req.session.messages = [JSON.stringify(req.user)];
          getPostsWithTags(req.user.tags, function() {
            return res.render('panel', {
              user: req.user,
              topics: topics,
              posts: posts,
              blog_url: blog_url,
              messages: [JSON.stringify(req.user), JSON.stringify(req.session)]
            });
          });
          return;
        }
        if (req.ip === '127.0.0.1') {
          res.writeHead(200, {
            'Content-Type': 'text/html;charset=UTF-8'
          });
          res.end("" + User.findOrCreate + "s" + req.ip + "<br><form method='get' action='/auth/facebook'><input type='submit' name='oi' value='post'></form>");
          return;
        }
        return User.find({}, function(err, users) {
          res.writeHead(200, {
            'Content-Type': 'text/html;charset=UTF-8'
          });
          res.write(JSON.stringify(users));
          return res.end('\noi, ' + req.ip + JSON.stringify(req.session) + "<form method='get' action='/auth/facebook'><input type='submit' name='oi' value='post'></form>");
        });
      },
      post: function(req, res) {
        return res.redirect('/auth/facebook');
      }
    },
    logout: {
      get: function(req, res) {
        req.logout();
        return res.redirect('/');
      }
    },
    session: {
      get: function(req, res) {
        return User.find({}, function(err, users) {
          var obj;
          obj = {
            ip: req.ip,
            session: req.session,
            users: users
          };
          return res.end(JSON.stringify(obj));
        });
      }
    },
    update: {
      get: function(req, res) {
        var chosen, topic, _i, _len, _ref;
        if (!req.user) {
          return res.redirect('/');
        }
        if (!req.query['topic'] || typeof req.query['topic'] === 'string') {
          req.query['topic'] = [req.query['topic']];
        }
        chosen = [];
        _ref = req.query['topic'];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          topic = _ref[_i];
          if (topic) {
            chosen.push(topic);
          }
        }
        console.log('chosen: ', chosen, req.query['topic']);
        req.user.tags = chosen;
        req.user.save();
        api.sendNotification(req.user.facebookId, 'You are now following the topics #{chosen} on MeAvisa.');
        getPostsWithTags(chosen, function() {});
        return res.redirect('back');
      }
    },
    dropall: {
      get: function(req, res) {
        if (req.user._id === "51e31a315aeae90200000001") {
          User.remove({}, function(err) {
            res.write("collection removed");
            return res.end(err);
          });
        } else {

        }
        return res.end("Cannot GET /dropall");
      }
    }
  };

}).call(this);
