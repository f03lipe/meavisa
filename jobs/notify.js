// Generated by CoffeeScript 1.6.3
(function() {
  var api, e, mongoUri, mongoose;

  if (module === require.main) {
    api = require('../src/api.js');
    try {
      require('../src/env.js');
    } catch (_error) {
      e = _error;
    }
    mongoose = require('mongoose');
    mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/madb';
    mongoose.connect(mongoUri);
    api.notifyNewPosts(function() {
      return mongoose.connection.close();
    });
  } else {
    throw "This module is supposed to be executed as a job.";
  }

}).call(this);