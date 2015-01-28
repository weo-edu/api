var AsyncEventEmitter = require('async-eventemitter');
var propertyPath = require('property-path');
var _ = require('lodash');
var debug = require('debug')('weo:hooks');
var Seq = require('seq');

var postQueue = [];
var onFlushQueue = [];
var pending = 0;
var throttling = false;

function maybeFlushed() {
  if(postQueue.length) {
    flushLater();
    return;
  }

  if(pending === 0 && throttling === false) {
    var fn;
    while((fn = onFlushQueue.shift()))
      fn();
  }
}

function postDispatch() {
  pending--;
  maybeFlushed();
}

function flush() {
  var e;

  throttling = false;
  while((e = postQueue.shift())) {
    var Schema = e[0];
    var args = e[1];

    pending++;
    args.push(postDispatch);
    Schema.dispatch.apply(Schema, args);
  }

  maybeFlushed();
}

// Just coalesce flushLater() calls that happen
// in the same event loop
var throttledFlush = _.throttle(flush, 1, {leading: false, trailing: true});
function flushLater() {
  throttling = true;
  setTimeout(throttledFlush);
}

/**
 * Mimics backbone events api with pre and post modifiers
 */

var SchemaEvents = function(Schema) {
  // Make sure we only get applied to a model once
  if(Schema.when)
    return;

  /**
   * property tracking
   */
  //XXX needs optimization
  //should only toJSON if tracking
  Schema.post('init', function(doc) {
    doc.$previous = doc.toObject({depopulate: 1});
  });

  Schema.method('previous', function(path) {
    return propertyPath.get(this.$previous, path);
  });

  Schema.method('changed', function(path) {
    // Have to do this in case the value has been populated
    var cur = this.populated(path) || this.get(path);
    if (_.isArray(cur)) {
      cur = cur.map(function(val) {
        return val.toJSON && val.toJSON() || val;
      });
    }

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

  Schema.postDispatch = function() {
    var args = _.toArray(arguments);

    postQueue.push([Schema, args]);
    flushLater();
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
  Schema.post('save', function(doc) {
    // used for avoidiing duplicate hooks
    doc.$dispatch = {};
    doc.$changed = [];
    if(Schema.$tracking) {
      Schema.$tracking.forEach(function(path) {
        if (doc.changed(path))
          doc.$changed.push(path);
      });
    }
  });

  Schema.post('save', function(doc) {
    if(doc.wasNew) {
      Schema.postDispatch('post:add', doc);
      delete doc.wasNew;
    } else {
      Schema.postDispatch('post:change', doc);
    }
  });

  Schema.pre('update', function(next) {
    Schema.dispatch('pre:change', this, next);
  });

  Schema.post('update', function(doc) {
    Schema.postDispatch('post:change', doc);
  });

  Schema.pre('remove', function(next) {
    Schema.dispatch('pre:remove', this, next);
  });

  Schema.post('remove', function(doc) {
    Schema.postDispatch('post:remove', doc);
  });

  Schema.pre('validate', function(next) {
    Schema.dispatch('pre:validate', this, next);
  });

  Schema.post('validate', function(doc) {
    Schema.postDispatch('post:validate', doc);
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
    model.$changed && model.$changed.forEach(function(path) {
      Schema.postDispatch('post:change:' + path, model);
    });
    model.$changed = [];
  });

  // this must be the last post hook
  Schema.post('save', function(doc) {
    SchemaEvents.onFlush(function() {
      doc.$previous = doc.toObject({depopulate: 1});
    });
  });
};

SchemaEvents.onFlush = function(cb) {
  onFlushQueue.push(cb);
  maybeFlushed();
};

module.exports = SchemaEvents;