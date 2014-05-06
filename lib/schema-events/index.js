var async = require('async');
var AsyncEventEmitter = require('async-eventemitter');
var propertyPath = require('property-path');
var _ = require('lodash');
var debug = require('debug')('weo:hooks');

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

  Schema._emitter = new AsyncEventEmitter;

  Schema.dispatch = function() {
    this._emitter.emit.apply(this._emitter, arguments);
  };


  /**
   * register middlewared event handlers for one or
   * more events
   * E.g. Schema.when('pre:save', 'pre:change:prop', hooks.addUser);
   * @return {[type]} [description]
   */
  Schema.when = function(/* arguments */) {
    var args = [].slice.call(arguments);

    // listener is always the last argument
    var listener = args.pop().bind(Schema);
    args.forEach(function(name) {
      Schema._emitter.on(name, listener);

      var name_split = name.split(':');
      if (name_split[1] === 'change' && name_split.length === 3) {
        Schema.track(name_split[2]);
      }
    });

    return this;
  };

  function handleError(next) {
    return function(err) {
      err && debug('error processing hook', err);
      next && next(err);
    };
  }

  /**
   * Events
   */

  Schema.pre('save', function(next) {
    if(this.isNew)
      Schema.dispatch('pre:add', this, handleError(next));
    else
      Schema.dispatch('pre:change', this, handleError(next));
  });

  Schema.post('save', function() {
    if(! this.previous('_id')) {
      Schema.dispatch('post:add', this, handleError());
    } else {
      Schema.dispatch('post:change', this, handleError());
    }
  });

  Schema.pre('update', function(next) {
    Schema.dispatch('pre:change', this, handleError(next));
  });

  Schema.post('update', function() {
    Schema.dispatch('post:change', this, handleError());
  });

  Schema.pre('remove', function(next) {
    Schema.dispatch('pre:remove', this, handleError(next));
  });

  Schema.post('remove', function() {
    Schema.dispatch('post:remove', this, handleError());
  });

  Schema.pre('validate', function(next) {
    Schema.dispatch('pre:validate', this, handleError(next));
  });

  Schema.post('validate', function() {
    Schema.dispatch('post:validate', this, handleError());
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