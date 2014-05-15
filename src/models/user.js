
/*
GUIDELINES for development:
- Never utilize directly request parameters or data.
 */
var Activity, Follow, Group, HandleLimit, Inbox, Notification, ObjectId, PopulateFields, Post, Resource, User, UserSchema, assert, assertArgs, async, fetchTimelinePostAndActivities, mongoose, _;

mongoose = require('mongoose');

_ = require('underscore');

async = require('async');

assert = require('assert');

assertArgs = require('./lib/assertArgs');

Resource = mongoose.model('Resource');

Activity = Resource.model('Activity');

Notification = mongoose.model('Notification');

Inbox = mongoose.model('Inbox');

Follow = Resource.model('Follow');

Group = Resource.model('Group');

Post = Resource.model('Post');

PopulateFields = '-memberships -accesssToken -firstAccess -followingTags';

ObjectId = mongoose.Types.ObjectId;

UserSchema = new mongoose.Schema({
  name: {
    type: String
  },
  username: {
    type: String
  },
  lastAccess: {
    type: Date,
    select: false
  },
  firstAccess: {
    type: Date,
    select: false
  },
  facebookId: {
    type: String
  },
  accessToken: {
    type: String,
    select: false
  },
  followingTags: [],
  profile: {
    location: '',
    bio: {
      type: String,
      "default": 'Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.'
    },
    home: '',
    avatarUrl: ''
  },
  stats: {
    posts: {
      type: Number,
      "default": 0
    },
    votes: {
      type: Number,
      "default": 0
    },
    followers: {
      type: Number,
      "default": 0
    },
    following: {
      type: Number,
      "default": 0
    }
  }
}, {
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  }
});

UserSchema.virtual('avatarUrl').get(function() {
  if (this.username === 'felipearagaopires') {
    return '/static/images/avatar.png';
  } else {
    return 'https://graph.facebook.com/' + this.facebookId + '/picture?width=200&height=200';
  }
});

UserSchema.virtual('profile.location').get(function() {
  return this.profile.location || 'Stanford, Palo Alto, Estados Unidos';
});

UserSchema.virtual('profile.from').get(function() {
  return this.profile.location || 'Rio de Janeiro, Brasil';
});

UserSchema.virtual('profile.bgUrl').get(function() {
  if (this.username === 'felipearagaopires') {
    return '/static/images/u/sta.jpg';
  } else {
    return '/static/images/rio.jpg';
  }
});

UserSchema.virtual('profileUrl').get(function() {
  return '/u/' + this.username;
});

UserSchema.virtual('path').get(function() {
  return '/u/' + this.username;
});

UserSchema.pre('remove', function(next) {
  return Follow.find().or([
    {
      followee: this
    }, {
      follower: this
    }
  ]).exec((function(_this) {
    return function(err, docs) {
      var follow, _i, _len;
      if (docs) {
        for (_i = 0, _len = docs.length; _i < _len; _i++) {
          follow = docs[_i];
          follow.remove(function() {});
        }
      }
      console.log("Removing " + err + " " + docs.length + " follows of " + _this.username);
      return next();
    };
  })(this));
});

UserSchema.pre('remove', function(next) {
  return Post.find({
    author: this
  }, (function(_this) {
    return function(err, docs) {
      var doc, _i, _len;
      if (docs) {
        for (_i = 0, _len = docs.length; _i < _len; _i++) {
          doc = docs[_i];
          doc.remove(function() {});
        }
      }
      console.log("Removing " + err + " " + docs.length + " posts of " + _this.username);
      return next();
    };
  })(this));
});

UserSchema.pre('remove', function(next) {
  return Notification.find().or([
    {
      agent: this
    }, {
      recipient: this
    }
  ]).remove((function(_this) {
    return function(err, docs) {
      console.log("Removing " + err + " " + docs + " notifications related to " + _this.username);
      return next();
    };
  })(this));
});

UserSchema.pre('remove', function(next) {
  return Activity.remove({
    actor: this
  }, (function(_this) {
    return function(err, docs) {
      console.log("Removing " + err + " " + docs + " activities related to " + _this.username);
      return next();
    };
  })(this));
});

UserSchema.methods.getFollowsAsFollowee = function(cb) {
  return Follow.find({
    followee: this,
    follower: {
      $ne: null
    }
  }, cb);
};

UserSchema.methods.getFollowsAsFollower = function(cb) {
  return Follow.find({
    follower: this,
    followee: {
      $ne: null
    }
  }, cb);
};

UserSchema.methods.getPopulatedFollowers = function(cb) {
  return this.getFollowsAsFollowee(function(err, docs) {
    if (err) {
      return cb(err);
    }
    return User.populate(docs, {
      path: 'follower',
      select: User.PopulateFields
    }, function(err, popFollows) {
      return cb(err, _.filter(_.pluck(popFollows, 'follower'), function(i) {
        return i;
      }));
    });
  });
};

UserSchema.methods.getPopulatedFollowing = function(cb) {
  return this.getFollowsAsFollower(function(err, docs) {
    if (err) {
      return cb(err);
    }
    return User.populate(docs, {
      path: 'followee',
      select: User.PopulateFields
    }, function(err, popFollows) {
      return cb(err, _.filter(_.pluck(popFollows, 'followee'), function(i) {
        return i;
      }));
    });
  });
};

UserSchema.methods.getFollowersIds = function(cb) {
  return this.getFollowsAsFollowee(function(err, docs) {
    return cb(err, _.pluck(docs || [], 'follower'));
  });
};

UserSchema.methods.getFollowingIds = function(cb) {
  return this.getFollowsAsFollower(function(err, docs) {
    return cb(err, _.pluck(docs || [], 'followee'));
  });
};

UserSchema.methods.doesFollowUser = function(user, cb) {
  assert(user instanceof User, 'Passed argument not a user document');
  return Follow.findOne({
    followee: user.id,
    follower: this.id
  }, function(err, doc) {
    return cb(err, !!doc);
  });
};

UserSchema.methods.dofollowUser = function(user, cb) {
  var self;
  assertArgs({
    $isModel: 'User'
  }, '$isCb');
  self = this;
  if ('' + user.id === '' + self.id) {
    return cb(true);
  }
  return Follow.findOne({
    follower: self,
    followee: user
  }, (function(_this) {
    return function(err, doc) {
      if (!doc) {
        doc = new Follow({
          follower: self,
          followee: user
        });
        doc.save();
        user.update({
          $inc: {
            'stats.followers': 1
          }
        }, function() {});
      }
      cb(err, !!doc);
      Notification.Trigger(self, Notification.Types.NewFollower)(self, user, function() {});
      Activity.Trigger(self, Notification.Types.NewFollower)({
        follow: doc,
        follower: self,
        followee: user
      }, function() {});
      return Resource.find().or([
        {
          __t: 'Post',
          group: null,
          parentPost: null,
          author: user._id
        }, {
          __t: 'Activity',
          group: null,
          actor: user._id
        }
      ]).limit(100).exec(function(err, docs) {
        console.log('Resources found:', err, docs.length);
        return Inbox.fillUserInboxWithResources(self, docs, function() {});
      });
    };
  })(this));
};

UserSchema.methods.unfollowUser = function(user, cb) {
  assertArgs({
    $isModel: User
  }, '$isCb');
  return Follow.findOne({
    follower: this,
    followee: user
  }, (function(_this) {
    return function(err, doc) {
      if (err) {
        return cb(err);
      }
      if (doc) {
        doc.remove(cb);
      }
      return user.update({
        $dec: {
          'stats.followers': 1
        }
      }, function() {});
    };
  })(this));
};

HandleLimit = function(func) {
  return function(err, _docs) {
    var docs;
    docs = _.filter(_docs, function(e) {
      return e;
    });
    return func(err, docs);
  };
};

fetchTimelinePostAndActivities = function(opts, postConds, actvConds, cb) {
  assertArgs({
    $contains: ['maxDate']
  });
  return Post.find(_.extend({
    parentPost: null,
    published: {
      $lt: opts.maxDate - 1
    }
  }, postConds)).sort('-published').populate('author').limit(opts.limit || 20).exec(HandleLimit(function(err, docs) {
    var minPostDate;
    if (err) {
      return cb(err);
    }
    minPostDate = 1 * (docs.length && docs[docs.length - 1].published) || 0;
    return async.parallel([
      function(next) {
        return Activity.find(_.extend(actvConds, {
          updated: {
            $lt: opts.maxDate,
            $gt: minPostDate
          }
        })).populate('resource actor target object').exec(next);
      }, function(next) {
        return Post.countList(docs, next);
      }
    ], HandleLimit(function(err, results) {
      var all;
      all = _.sortBy((results[0] || []).concat(results[1]), function(p) {
        return -p.published;
      });
      return cb(err, all, minPostDate);
    }));
  }));
};


/*
 * Behold.
 */

UserSchema.methods.getTimeline = function(opts, callback) {
  var self;
  assertArgs({
    $contains: 'maxDate'
  }, '$isCb');
  self = this;
  return Inbox.find({
    recipient: self.id,
    dateSent: {
      $lt: opts.maxDate
    }
  }).sort('-dateSent').populate('resource').exec((function(_this) {
    return function(err, docs) {
      var minDate, posts;
      if (err) {
        return cb(err);
      }
      posts = _.pluck(docs, 'resource').filter(function(i) {
        return i;
      });
      console.log("" + posts.length + " posts gathered from inbox");
      if (!posts.length || !docs[docs.length - 1]) {
        minDate = 0;
      } else {
        minDate = posts[posts.length - 1].published;
      }
      return Resource.populate(posts, {
        path: 'author actor target object',
        select: User.PopulateFields
      }, function(err, docs) {
        if (err) {
          return callback(err);
        }
        return async.map(docs, function(post, done) {
          if (post instanceof Post) {
            return Post.count({
              type: 'Comment',
              parentPost: post
            }, function(err, ccount) {
              return Post.count({
                type: 'Answer',
                parentPost: post
              }, function(err, acount) {
                return done(err, _.extend(post.toJSON(), {
                  childrenCount: {
                    Answer: acount,
                    Comment: ccount
                  }
                }));
              });
            });
          } else {
            return done(null, post.toJSON);
          }
        }, function(err, results) {
          return callback(err, results, minDate);
        });
      });
    };
  })(this));
};

UserSchema.statics.PopulateFields = PopulateFields;

UserSchema.statics.getUserTimeline = function(user, opts, cb) {
  assertArgs({
    $isModel: User
  }, {
    $contains: 'maxDate'
  });
  return fetchTimelinePostAndActivities({
    maxDate: opts.maxDate
  }, {
    group: null,
    author: user,
    parentPost: null
  }, {
    actor: user,
    group: null
  }, function(err, all, minPostDate) {
    return cb(err, all, minPostDate);
  });
};


/*
Create a post object with type comment.
 */

UserSchema.methods.postToParentPost = function(parentPost, data, cb) {
  var comment;
  assertArgs({
    $isModel: Post
  }, {
    $contains: ['content', 'type']
  }, '$isCb');
  comment = new Post({
    author: this,
    group: parentPost.group,
    data: {
      body: data.content.body
    },
    parentPost: parentPost,
    type: data.type
  });
  comment.save(cb);
  return Notification.Trigger(this, Notification.Types.PostComment)(comment, parentPost, function() {});
};


/*
Create a post object and fan out through inboxes.
 */

UserSchema.methods.createPost = function(data, cb) {
  var post, self;
  self = this;
  assertArgs({
    $contains: ['content', 'type', 'tags']
  }, '$isCb');
  post = new Post({
    author: self.id,
    data: {
      title: data.content.title,
      body: data.content.body
    },
    type: data.type,
    tags: data.tags
  });
  if (data.groupId) {
    post.group = data.groupId;
  }
  self = this;
  return post.save((function(_this) {
    return function(err, post) {
      console.log('post save:', err, post);
      cb(err, post);
      if (err) {
        return;
      }
      if (post.group) {
        return;
      }
      self.update({
        $inc: {
          'stats.posts': 1
        }
      }, function() {});
      return self.getPopulatedFollowers(function(err, followers) {
        return Inbox.fillInboxes([self].concat(followers), {
          resource: post.id,
          type: Inbox.Types.Post,
          author: self.id
        }, function() {});
      });
    };
  })(this));
};

UserSchema.methods.upvotePost = function(post, cb) {
  assertArgs({
    $isModel: Post
  }, '$isCb');
  post.votes.addToSet('' + this.id);
  post.save(cb);
  if (!post.parentPost) {
    return User.findById(post.author, function(err, author) {
      if (!err) {
        return author.update({
          $inc: {
            'stats.votes': 1
          }
        }, function() {});
      }
    });
  }
};

UserSchema.methods.unupvotePost = function(post, cb) {
  var i;
  assertArgs({
    $isModel: Post
  }, '$isCb');
  if ((i = post.votes.indexOf(this.id)) > -1) {
    post.votes.splice(i, 1);
    return post.save(cb);
  } else {
    return cb(null, post);
  }
};


/*
Generate stuffed profile for the controller.
 */

UserSchema.methods.genProfile = function(cb) {
  return cb(null, this.toJSON());
};

UserSchema.methods.getNotifications = function(cb) {
  return Notification.find({
    recipient: this
  }).limit(6).sort('-dateSent').exec(cb);
};

UserSchema.plugin(require('./lib/hookedModelPlugin'));

module.exports = User = Resource.discriminator("User", UserSchema);
