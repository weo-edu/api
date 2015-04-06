const {ifElse, identity} = require('ramda');

/**
 * Takes in a transform function and returns
 * a function that executes the supplied transform
 * only if its argument is truthy
 *
 */
return function(xf) {
  return ifElse(identity, xf, identity);
};