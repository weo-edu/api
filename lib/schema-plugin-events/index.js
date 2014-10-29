var AsyncEventEmitter = require('async-eventemitter');
var propertyPath = require('property-path');
var _ = require('lodash');
var debug = require('debug')('weo:hooks');
var Seq = require('seq');

/**
 * Mimics backbone events api with pre and post modifiers
 */

module.exports = function(Schema) {
  // Make sure we only get applied to a model once
  if(Schema.when)
    return;

  /**
   * property tracking
   */
  Schema.post('init', function() {
    this.$previous = this.toObject({depopulate: 1});
  });

  Schema.method('previous', function(path) {
    return propertyPath.get(this.$previous, path);
  });

  Schema.method('changed', function(path) {
    // Have to do this in case the value has been populated
    var cur = this.populated(path) || this.get(path);
    return ! _.isEqual(
      propertyPath.get(this.$previous, path),
      cur
    );
  });

  /**
   * Listeners
   */

  Schema.track = function(path) {
    this.$tracking = this.$tracking || [];
    this.$tracking.push(path);
    this.$tracking = _.uniq(this.$tracking);
  };

  Schema._emitter = new AsyncEventEmitter;

  Schema.dispatch = function() {
    var args = _.toArray(arguments);

    // If no callback is specified, use our
    // standard error handling callback
    if('function' !== typeof args[args.length - 1])
      args.push(function() {});

    // Wrap next in our error handler
    args[args.length - 1] = handleError(args[args.length - 1], args[0], args[1]);
    Schema._emitter.emit.apply(Schema._emitter, args);
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

  function handleError(next, name, model) {
    return function(err) {
      err && debug('error processing hook - ' + name + ':' + model.kind + '!' + model.id, err.stack);
      next && next(err);
    };
  }

  /**
   * Events
   */

  Schema.pre('save', function(next) {
    // used for avoidiing duplicate hooks
    this.$dispatch = {};
    if(this.isNew) {
      Schema.dispatch('pre:add', this, next);
      // So we can emit post:add later
      this.wasNew = true;
    }
    else {
      Schema.dispatch('pre:change', this, next);
    }
  });

  // collect all changes made in pre
  // this should be the first post hook
  Schema.post('save', function() {
    // used for avoidiing duplicate hooks
    this.$dispatch = {};
    var self = this;
    self.$changed = [];
    _.each(Schema.$tracking, function(path) {
      if (self.changed(path))
        self.$changed.push(path);
    });
    
  });

  Schema.post('save', function() {
    if(this.wasNew) {
      Schema.dispatch('post:add', this);
      delete this.wasNew;
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

  Schema.pre('validate', function(next) {
    Schema.dispatch('pre:validate', this, next);
  });

  Schema.post('validate', function() {
    Schema.dispatch('post:validate', this);
  });


  /**
   * Attribute Change Events
   */

  Schema.when('pre:change', function(model, next) {
    Seq(this.$tracking || [])
    .seqEach(function(path) {
      if (model.changed(path)) {
        Schema.dispatch('pre:change:' + path, model, this);
      } else
        this();
    })
    .seq(function() { next(); })
    .catch(next);
  });

  Schema.when('post:change', function(model) {
    console.log('model changed', model.$changed);
    model.$changed && model.$changed.forEach(function(path) {
      Schema.dispatch('post:change:' + path, model);
    });
    model.$changed = [];
  });


  // this must be the last post hook
  Schema.post('save', function() {
    this.$previous = this.toObject({depopulate: 1});
  });



  Schema.eventFilter = function() {
    var paths = _.toArray(arguments);
    var listener = paths.pop().bind(Schema);
    return function(model, next) {
      var pass = _.any(paths, function(path) {
        return model.changed(path);
      });
      if (pass)
       listener(model, next);
      else
        next && next();
    };
  };
};