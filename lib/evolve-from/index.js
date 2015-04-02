const {curry, curryN, call, flip, mapObj, merge} = require('ramda');
const execOn = flip(curryN(2, call));

module.exports = curry(function(transformations, obj) {
  return merge(obj, mapObj(execOn(obj), obj));
});