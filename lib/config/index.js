module.exports = {
  // Port for the app to listen on
  port: process.env.PORT || 1337,
  // Parameters for our password hashing function
  hash: {
    algorithm: 'sha256',
    saltLength: 16,
    iterations: 5
  },
  // Used by the hashids library as a salt
  hashIdKey: 'themang',
  s3: {
    uploads: {
      size: '5mb',
      key: "AKIAIMDHEMBP5SULSA3A",
      secret: "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",
      bucket: process.env.NODE_ENV === 'development'
        ? 'dev.eos.io'
        : 'eos.io'
    },
    avatar: {
      key: "AKIAIMDHEMBP5SULSA3A",
      secret: "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",
      bucket: 'avatar.eos.io',
      region: 'us-west-1'
    }
  },
  mongo: {
    url: process.env.MONGO_URL || 'mongodb://localhost:27017/eos'
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://127.0.0.1:6379/eos'
  },
  avatar: 'http://avatar.eos.io/',
  userProfile: 'http://weo.io/user/'
};