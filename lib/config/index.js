if('undefined' !== typeof window)
  throw new Error('config should not be present on the client');

var config = {
  // Port for the app to listen on
  port: process.env.PORT || 1337,
  avatarServer: 'http://cdn.eos.io.s3-website-us-west-1.amazonaws.com',
  // Parameters for our password hashing function
  hash: {
    algorithm: 'sha256',
    saltLength: 16,
    iterations: 5
  },
  hashIds: {
    key: 'themang',
    minLength: 6,
    alphabet: '23456789abcdefghjkmnpqrstuvwxyz'
  },
  s3: {
    uploads: {
      size: '5mb',
      key: "AKIAIIA5OZD3IKVSUXDA",
      secret: "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",
      bucket: process.env.NODE_ENV === 'production'
        ? 'eos.io'
        : 'dev.eos.io'
    },
    avatar: {
      key: "AKIAIIA5OZD3IKVSUXDA",
      secret: "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",
      bucket: 'cdn.eos.io',
      region: 'us-west-1'
    }
  },
  mongo: {
    url: process.env.MONGOHQ_URL || process.env.MONGO_URL || 'mongodb://localhost:27017/eos'
  },
  redis: {
    url: process.env.REDISTOGO_URL || process.env.REDIS_URL || 'redis://127.0.0.1:6379'
  },
  production: {
    frontEnd: 'http://weo.io',
    emailUser: 'info@weo.io',
    emailPass: 'elliotrileytio'
  },
  staging: {
    frontEnd: 'http://staging.weo.io',
    emailUser: 'testmail@weo.io',
    emailPass: 'themangthemang'
  },
  development: {
    frontEnd: 'http://localhost:3000',
    emailUser: 'testmail@weo.io',
    emailPass: 'themangthemang'
  },
  ci: {
    frontEnd: 'http://localhost:3000',
    emailUser: 'testmail@weo.io',
    emailPass: 'themangthemang'
  }
};

var _ = require('lodash')
  , modes = ['development', 'production', 'ci', 'staging'];

function getEnv() {
  if(typeof window === 'undefined') {
    if (!process.env.NODE_ENV || process.env.NODE_ENV === 'test') {
      return 'development';
    } else
      return process.env.NODE_ENV;
  }
  return typeof SETTINGS === 'undefined'
    ? 'development'
    : SETTINGS.env;
}

_.merge(config, config[getEnv()], function(a, b) {
  return _.isArray(a) ? a.concat(b) : undefined;
});
_.each(modes, function(mode) {
  delete config[mode];
});

module.exports = config;
