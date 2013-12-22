require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Skill
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

var model = module.exports = {
  adapter: 'mongo',
  types: {
    virtual: function() { return true; },
    fn: function() { return true; },
  },
  attributes: {
    description: 'string',
    name: {
      type: 'string',
      required: true
    },
    grade: {
      type: 'integer',
      min: 0,
      max: 12
    },
    url: {
      type: 'string',
      url: true
    },
    subject: 'string',
    topic: 'string',
    tags: 'array',
    icon: {
      type: 'virtual',
      fn: function() {
        return this.url + '/icon';
      }
    },
  	/* e.g.
  	nickname: 'string'
  	*/
  }
};

model.beforeCreate = [require('../services/hashids.js')('skill'),
    require('../services/virtualize.js')(model.attributes)];
model.beforeUpdate = [require('../services/virtualize.js')(model.attributes)];
},{"../services/hashids.js":5,"../services/virtualize.js":6}],2:[function(require,module,exports){
/**
 * Tag
 *
 * @module      :: Model
 * @description :: A short summary of how this model works and what it represents.
 * @docs		:: http://sailsjs.org/#!documentation/models
 */

module.exports = {
  adapter: 'mongo',
  attributes: {
    name: {
      required: true,
      type: 'string'
    },
    type: {
      required: true,
      type: 'string',
      in: ['subject', 'topic', 'commonCore', 'general']
    },
    count: {
      type: 'integer',
      defaultsTo: 0
    },
    excerpt: {
      type: 'string',
      minLength: 20,
      maxLength: 460
    },
    body: {
      type: 'string'
    }
  	
  	/* e.g.
  	nickname: 'string'
  	*/
    
  },
  beforeCreate: function(values, next) {
    values._id = values.type + '-' + values.name;
    next();
  }
};

},{}],"QQQs80":[function(require,module,exports){
module.exports = {
  Skill: require('../models/Skill.js'),
  Tag: require('../models/Tag.js')
};
},{"../models/Skill.js":1,"../models/Tag.js":2}],"clientModels":[function(require,module,exports){
module.exports=require('QQQs80');
},{}],5:[function(require,module,exports){
module.exports = function() {
  //  Empty stub
};
},{}],6:[function(require,module,exports){
module.exports=require(5)
},{}]},{},[])
;