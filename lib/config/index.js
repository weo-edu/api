module.exports = {
  // Port for the app to listen on
  port: process.env.PORT || 1337,
  avatarServer: 'http://avatar.eos.io',
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
      key: "AKIAIMDHEMBP5SULSA3A",
      secret: "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",
      bucket: process.env.NODE_ENV === 'production'
        ? 'eos.io'
        : 'dev.eos.io'
    },
    avatar: {
      key: "AKIAIMDHEMBP5SULSA3A",
      secret: "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",
      bucket: 'avatar.eos.io',
      region: 'us-west-1'
    }
  },
  mongo: {
    url: process.env.MONGOHQ_URL || process.env.MONGO_URL || 'mongodb://localhost:27017/eos'
  },
  redis: {
    url: process.env.REDISTOGO_URL || process.env.REDIS_URL || 'redis://127.0.0.1:6379'
  },
  frontEnd: process.env.NODE_ENV === 'production' ?  'http://weo.io' : 'http://localhost:3000',
  emailUser: process.env.NODE_ENV === 'production' ? 'info@weo.io' : 'testmail@weo.io',
  emailPass: process.env.NODE_ENV === 'production' ? 'elliotrileytio' : 'themangthemang',
};