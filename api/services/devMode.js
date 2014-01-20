module.exports = function() {
  return sails.config.environment === 'development';
};