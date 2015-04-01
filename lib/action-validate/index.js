module.exports = function(validator) {
  return action(['originalRecord'], 'nowhere', function(originalRecord) {
    if(! validator(originalRecord))
      throw new Error('Invalid record');
  });
};