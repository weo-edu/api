var async = require('async');
var AsyncEventEmitter = require('async-eventemitter');
var propertyPath = require('property-path');
var _ = require('lodash');


/**
 * Mimics backbone events api with pre and post modifiers
 */

module.exports = function(Schema) {

  /**
   * property tracking
   */
  Schema.post('init', function() {
    this.$previous = this.toObject();
  });

  Schema.post('save', function() {
    this.$previous = this.toObject();
  })

  Schema.method('previous', function(path) {
    return propertyPath.get(this.$old, path);
  });

  Schema.method('changed', function(path) {
    return _.isEqual(propertyPath.get(this.$old, path), propertyPath.get(this, path));
  });



  /**
   * Listeners
   */
  
  Schema.track = function(path) {
    this.$tracking = this.$tracking || [];
    this.$tracking.push(path);
  };

  Schema.dispatch = function() {
    if (!this._emitter)
      this._emiiter = new AsyncEventEmitter;
    this._emitter.emit.apply(this._emitter, arguments);
  };

  Schema.when = function(name, listener) {
    if (!this._emitter)
      this._emitter = new AsyncEventEmitter;
    this._emitter.on(name, listener.bind(this));

    var name_split = name.split(':')
    if (name_split[1] === 'change' && name_split.length === 3) {
      Schema.track(name_split[2]);
    }
  };


  /**
   * Events
   */

  Schema.pre('save', function(next) {
    if (this.isNew) {
      Schema.dispatch('pre:add', this, next);
    } else {
      Schema.dispatch('pre:change', this, next);
    }
  });

  Schema.post('save', function() {
    if (!this.previous('_id')) {
      Schema.dispatch('post:add', this);
    } else {
      Schema.dispatch('post:change', this);
    }
  });

  Schema.pre('update', function(next) {
    Schema.dispatch('pre:change', this, next);
  });

  Schema.post('update', function() {
    Schema.dispatch('post:change', this);
  });

  Schema.pre('remove', function(next) {
    Schema.dispatch('pre:remove', this, next);
  });

  Schema.post('remove', function() {
    Schema.dispatch('post:remove', this);
  });


  /**
   * Attribute Change Events
   */
  

  _.each(['pre:change', 'post:change'], function(evt) {
    Schema.when(evt, function(model, next) {
      async.each(this.$tracking || [], function(path, cb) {
        if (model.changed(path)) {
          Schema.dispatch(evt + ':' + path, model, cb)
        } else 
          cb();
      }, next);
    });
  });
  


}