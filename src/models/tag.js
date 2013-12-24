var TagSchema, authTypes, checkFollowed, crypto, descTable, findOrCreate, getDescription, getLabel, mongoose, recursify, transTable, _,
  __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

mongoose = require('mongoose');

crypto = require('crypto');

_ = require('underscore');

authTypes = [];

TagSchema = new mongoose.Schema({
  name: {
    type: String
  },
  children: {
    type: Array
  },
  description: {
    type: String
  }
});

TagSchema.methods = {};

findOrCreate = function(conditions, doc, options, callback) {
  var self;
  if (arguments.length < 4) {
    if (typeof options === 'function') {
      callback = options;
      options = {};
    } else if (typeof doc === 'function') {
      callback = doc;
      doc = {};
      options = {};
    }
  }
  self = this;
  return this.findOne(conditions, function(err, result) {
    var obj;
    if (err || result) {
      if (options && options.upsert && !err) {
        return self.update(conditions, doc, function(err, count) {
          return self.findOne(conditions, function(err, result) {
            return callback(err, result, false);
          });
        });
      } else {
        return callback(err, result, false);
      }
    } else {
      conditions = _.extend(conditions, doc);
      obj = new self(conditions);
      return obj.save(function(err) {
        return callback(err, obj, true);
      });
    }
  });
};

String.prototype.toCamel = function(){
	return this.replace(/([a-z]+)/g, function(a){return a[0].toUpperCase()+a.slice(1);});
};;

transTable = {
  'estagio': 'Estágio',
  'olimpiadas': 'Olimpíadas',
  'voluntariado': 'Voluntariado',
  'bolsasdeestudo': 'Bolsas de Estudo',
  'matematica': 'Matemática',
  'cursos': 'Cursos',
  'intercambio': 'Intercâmbio'
};

descTable = {
  'olimpiadas:matematica': 'Novidades sobre a <a href="#">OBM</a>, <a href="#">OBMEP</a>, olimpíadas de matemática estaduais e cursos relacionados à elas.',
  'intercambio': 'Já pensou em estudar no exterior? É possível! Siga a tag para saber sobre bolsas de estudo, palestras e outros eventos relacionados a intercâmbio.',
  'mun': 'O Modelo das Nações unidas (Model United Nations) é um modelo de organizações internacionais realizado por estudantes para simular o funcionamento da ONU e, assim, desenvolverem suas habilidades de falar em público.'
};

recursify = function(tags) {
  var chashtag, hashtag, parent, tagList, tagsObj, _base, _i, _len;
  tagsObj = {
    hashtag: '',
    label: null,
    children: {}
  };
  for (_i = 0, _len = tags.length; _i < _len; _i++) {
    hashtag = tags[_i];
    tagList = hashtag.split(':');
    parent = tagsObj;
    while (tagList.length) {
      hashtag = tagList.shift();
      chashtag = parent.hashtag + (!parent.hashtag ? '' : ':') + hashtag;
      parent = (_base = parent.children)[hashtag] != null ? (_base = parent.children)[hashtag] : _base[hashtag] = {
        hashtag: chashtag,
        label: getLabel(hashtag),
        description: getDescription(chashtag),
        children: {}
      };
    }
  }
  return tagsObj.children;
};

checkFollowed = function(rtags, followed) {
  var check;
  _.each(rtags, check = function(e, i) {
    var _ref;
    _.each(e.children, check);
    return e.checked = (_ref = e.hashtag, __indexOf.call(followed, _ref) >= 0) ? true : false;
  });
  return rtags;
};

getDescription = function(hashtag) {
  return descTable[hashtag.toLowerCase()] || '';
};

getLabel = function(hashtag) {
  return transTable[hashtag.toLowerCase()] || hashtag.toCamel();
};

TagSchema.statics.findOrCreate = findOrCreate;

TagSchema.statics.getLabel = getLabel;

TagSchema.statics.getDescription = getDescription;

TagSchema.statics.recursify = recursify;

TagSchema.statics.checkFollowed = checkFollowed;

module.exports = mongoose.model("Tag", TagSchema);
