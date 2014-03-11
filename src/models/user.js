
/*
GUIDELINES for development:
- Never utilize directly request parameters or data.
- Crucial: never remove documents by calling Model.remove. They prevent hooks
  from firing. See http://mongoosejs.com/docs/api.html#model_Model.remove
 */
var Activity, Follow, Group, HandleLimit, Inbox, Notification, ObjectId, Post, User, UserSchema, assert, async, mongoose, _;

mongoose = require('mongoose');

_ = require('underscore');

async = require('async');

assert = require('assert');

Inbox = mongoose.model('Inbox');

Follow = mongoose.model('Follow');

Activity = mongoose.model('Activity');

Post = mongoose.model('Post');

Group = mongoose.model('Group');

Notification = mongoose.model('Notification');

ObjectId = mongoose.Types.ObjectId;

UserSchema = new mongoose.Schema({
  name: String,
  username: String,
  lastAccess: Date,
  firstAccess: Date,
  facebookId: String,
  accessToken: String,
  profile: {
    fullName: '',
    birthday: Date,
    email: String,
    city: '',
    avatarUrl: '',
    badges: []
  },
  lastUpdate: {
    type: Date,
    "default": Date(0)
  },
  notifiable: {
    type: Boolean,
    "default": true
  },
  tags: Array,
  followingTags: []
}, {
  toObject: {
    virtuals: true
  },
  toJSON: {
    virtuals: true
  }
});

UserSchema.virtual('avatarUrl').get(function() {
  return 'https://graph.facebook.com/' + this.facebookId + '/picture';
});

UserSchema.virtual('profileUrl').get(function() {
  return '/p/' + this.username;
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
  return Group.Membership.remove({
    member: this
  }, (function(_this) {
    return function(err, count) {
      console.log("Removing " + err + " " + count + " memberships of " + _this.username);
      return next();
    };
  })(this));
});

UserSchema.methods.getFollowsAsFollowee = function(cb) {
  return Follow.find({
    followee: this
  }, cb);
};

UserSchema.methods.getFollowsAsFollower = function(cb) {
  return Follow.find({
    follower: this
  }, cb);
};

UserSchema.methods.getPopulatedFollowers = function(cb) {
  return this.getFollowsAsFollowee(function(err, docs) {
    if (err) {
      return cb(err);
    }
    return User.populate(docs, {
      path: 'follower'
    }, function(err, popFollows) {
      return cb(err, _.pluck(popFollows, 'follower'));
    });
  });
};

UserSchema.methods.getPopulatedFollowing = function(cb) {
  return this.getFollowsAsFollower(function(err, docs) {
    if (err) {
      return cb(err);
    }
    return User.populate(docs, {
      path: 'followee'
    }, function(err, popFollows) {
      return cb(err, _.pluck(popFollows, 'followee'));
    });
  });
};

UserSchema.methods.getFollowersIds = function(cb) {
  return this.getFollowsAsFollowee(function(err, docs) {
    console.log(docs, _.pluck(docs || [], 'follower'));
    return cb(err, _.pluck(docs || [], 'follower'));
  });
};

UserSchema.methods.getFollowingIds = function(cb) {
  return this.getFollowsAsFollower(function(err, docs) {
    return cb(err, _.pluck(docs || [], 'followee'));
  });
};

UserSchema.methods.countFollowers = function(cb) {
  return Follow.count({
    followee: this
  }, cb);
};

UserSchema.methods.countFollowees = function(cb) {
  return Follow.count({
    follower: this
  }, cb);
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
  assert(user instanceof User, 'Passed argument not a user document');
  if ('' + user.id === '' + this.id) {
    return cb(true);
  }
  Follow.findOne({
    follower: this,
    followee: user
  }, (function(_this) {
    return function(err, doc) {
      if (!doc) {
        doc = new Follow({
          follower: _this,
          followee: user
        });
        doc.save();
      }
      return cb(err, !!doc);
    };
  })(this));
  Notification.Trigger(this, Notification.Types.NewFollower)(this, user, function() {});
  return Activity.Trigger(this, Notification.Types.NewFollower)(this, user, function() {});
};

UserSchema.methods.unfollowUser = function(user, cb) {
  assert(user instanceof User, 'Passed argument not a user document');
  return Follow.findOne({
    follower: this,
    followee: user
  }, (function(_this) {
    return function(err, doc) {
      if (err) {
        return cb(err);
      }
      if (doc) {
        return doc.remove(cb);
      }
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


/*
 * Behold.
 */

UserSchema.methods.getTimeline = function(_opts, cb) {
  var mergeNonInboxedPosts, mergePopulatedActivities, opts;
  opts = _.extend({
    limit: 10
  }, _opts);
  if (!opts.maxDate) {
    opts.maxDate = Date.now();
  }

  /*
   */
  mergePopulatedActivities = (function(_this) {
    return function(minDate, maxDate, cb) {
      console.log("lt " + maxDate + " gt " + minDate);
      return Activity.find({
        recipient: _this.id,
        dateCreated: {
          $lt: maxDate,
          $gt: minDate
        }
      }).sort('-dataCreated').exec(function(err, docs) {
        console.log(err, docs);
        return Activity.populateResources(docs, function() {
          return console.log(arguments);
        });
      });
    };
  })(this);

  /*
  	 * Merge inboxes posts with those from followed users but that preceed "followship".
  	 * Limit search to those posts made after @minDate.
   */
  mergeNonInboxedPosts = (function(_this) {
    return function(minDate, ips) {
      var onGetNonInboxedPosts;
      Follow.find({
        follower: _this,
        dateBegin: {
          $gt: minDate
        }
      }).exec(function(err, follows) {
        if (err) {
          return cb(err);
        }
        return async.mapLimit(follows, 5, (function(follow, done) {
          var ltDate;
          ltDate = Math.min(follow.dateBegin, opts.maxDate);
          return Post.find({
            author: follow.followee,
            group: null,
            parentPost: null,
            dateCreated: {
              $lt: ltDate,
              $gt: minDate
            }
          }).limit(opts.limit).exec(done);
        }), function(err, _docs) {
          var nips;
          nips = _.flatten(_docs).filter(function(i) {
            return i;
          });
          return onGetNonInboxedPosts(err, nips);
        });
      });
      return onGetNonInboxedPosts = function(err, nips) {
        var all;
        if (err) {
          return cb(err);
        }
        all = _.sortBy(nips.concat(ips), function(p) {
          return p.dateCreated;
        });
        return User.populate(all, {
          path: 'author'
        }, (function(_this) {
          return function(err, docs) {
            if (err) {
              return cb(err);
            }
            return Post.fillComments(docs, cb);
          };
        })(this));
      };
    };
  })(this);
  return Inbox.find({
    recipient: this.id,
    type: Inbox.Types.Post,
    dateSent: {
      $lt: opts.maxDate
    }
  }).sort('-dateSent').populate('resource').limit(opts.limit).exec(HandleLimit((function(_this) {
    return function(err, docs) {
      var oldestPostDate, posts;
      if (err) {
        return cb(err);
      }
      posts = _.pluck(docs, 'resource').filter(function(i) {
        return i;
      });

      /*
      			 * Get oldest post date
      			 * Non-inboxed posts must be younger than that, so that at least opts.limit
      			 * posts are created.
       */
      if (posts.length === opts.limit) {
        oldestPostDate = posts[posts.length - 1].dateCreated;
      } else {
        oldestPostDate = new Date(0);
      }
      try {
        mergeNonInboxedPosts(oldestPostDate, posts);
        return mergePopulatedActivities(oldestPostDate, new Date());
      } catch (_error) {}
    };
  })(this)));
};

UserSchema.statics.getPostsFromUser = function(userId, opts, cb) {
  return Post.find({
    author: userId,
    parentPost: null,
    group: null
  }).sort('-dateCreated').populate('author').limit(opts.limit || 10).skip(opts.skip || 0).exec(function(err, docs) {
    if (err) {
      return cb(err);
    }
    return Post.fillComments(docs, cb);
  });
};

UserSchema.methods.getLabPosts = function(opts, group, cb) {
  if (!opts.maxDate) {
    opts.maxDate = Date.now();
  }
  return Post.find({
    group: group,
    parentPost: null,
    dateCreated: {
      $lt: opts.maxDate
    }
  }).limit(opts.limit || 10).skip(opts.skip || 0).populate('author').exec(function(err, docs) {
    return Post.fillComments(docs, cb);
  });
};

UserSchema.methods.createGroup = function(data, cb) {
  var group;
  group = new Group({
    profile: {
      name: data.profile.name
    }
  });
  return group.save((function(_this) {
    return function(err, group) {
      if (err) {
        return cb(err);
      }
      return group.addUser(_this, Group.Membership.Types.Moderator, function(err, membership) {
        return cb(err, group);
      });
    };
  })(this));
};

UserSchema.methods.addUserToGroup = function(member, group, type, cb) {
  assert(_.all([member, group, type, cb]), "Wrong number of arguments supplied to User.addUserToGroup");
  return Group.Membership.findOne({
    group: group,
    member: this
  }, function(err, mship) {
    if (err) {
      return cb(err);
    }
    if (!mship || mship.type !== Group.Membership.Types.Moderator) {
      return cb({
        error: true,
        name: 'Unauthorized'
      });
    }
    return Group.Membership.findOne({
      group: group,
      member: member
    }, function(err, mem) {
      if (err) {
        return cb(err, mem);
      }
      if (mem) {
        mem.type = type;
        return mem.save(function(err) {
          return cb(err, mem);
        });
      } else {
        mem = new Group.Membership({
          member: member,
          type: type,
          group: group
        });
        return mem.save(function(err) {
          return cb(err, mem);
        });
      }
    });
  });
};

UserSchema.methods.removeUserFromGroup = function(member, group, type, cb) {
  assert(_.all([member, group, type, cb]), "Wrong number of arguments supplied to User.addUserToGroup");
  return Group.Membership.find({
    group: group,
    member: this
  }, function(err, mship) {
    if (err) {
      return cb(err);
    }
    if (!mship) {
      return cb({
        error: true,
        name: 'Unauthorized'
      });
    }
    return Group.Membership.remove({
      group: group,
      member: member
    }, function(err, mem) {
      if (err) {
        return cb(err, mem);
      }
    });
  });
};


/*
Create a post object with type comment.
 */

UserSchema.methods.commentToPost = function(parentPost, data, cb) {
  var comment;
  comment = new Post({
    author: this,
    group: parentPost.group,
    data: {
      body: data.content.body
    },
    parentPost: parentPost,
    type: Post.Types.Comment
  });
  comment.save(cb);
  return Notification.Trigger(this, Notification.Types.PostComment)(comment, parentPost, function() {});
};


/*
Create a post object and fan out through inboxes.
 */

UserSchema.methods.createPost = function(data, cb) {
  var post;
  post = new Post({
    author: this.id,
    data: {
      title: data.content.title,
      body: data.content.body
    }
  });
  if (data.groupId) {
    post.group = data.groupId;
  }
  return post.save((function(_this) {
    return function(err, post) {
      console.log('post save:', err, post);
      cb(err, post);
      if (post.group) {
        return;
      }
      return _this.getPopulatedFollowers(function(err, followers) {
        return Inbox.fillInboxes({
          recipients: [_this].concat(followers),
          resource: post,
          type: Inbox.Types.Post,
          author: _this.id
        }, function() {});
      });
    };
  })(this));
};


/*
Generate stuffed profile for the controller.
 */

UserSchema.methods.genProfile = function(cb) {
  return this.getPopulatedFollowers((function(_this) {
    return function(err1, followers) {
      if (err1) {
        followers = null;
      }
      return _this.getPopulatedFollowing(function(err2, following) {
        if (err2) {
          following = null;
        }
        return Group.Membership.find({
          member: _this
        }).populate('group').exec(function(err3, memberships) {
          var profile;
          profile = _.extend(_this, {});
          if (followers) {
            profile.followers = {
              docs: followers.slice(0, 20),
              count: followers.length
            };
          }
          if (following) {
            profile.following = {
              docs: following.slice(0, 20),
              count: following.length
            };
          }
          if (memberships) {
            profile.groups = _.pluck(memberships, 'group');
          }
          return cb(err1 || err2 || err3, profile);
        });
      });
    };
  })(this));
};

UserSchema.methods.getNotifications = function(cb) {
  return Notification.find({
    recipient: this
  }).limit(6).sort('-dateSent').exec(cb);
};

UserSchema.plugin(require('./lib/hookedModelPlugin'));

module.exports = User = mongoose.model("User", UserSchema);
