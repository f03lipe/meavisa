var e, mongoUri, mongoose;

if (module === require.main) {
  try {
    require('../src/env.js');
  } catch (_error) {
    e = _error;
  }
  mongoose = require('mongoose');
  mongoUri = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost/madb';
  mongoose.connect(mongoUri);
  require('../src/api.js').pushNewPosts(function() {
    return mongoose.connection.close();
  });
} else {
  throw "This module is supposed to be executed as a job.";
}
