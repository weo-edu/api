if('undefined' !== typeof window)
  throw new Error('config should not be present on the client');

module.exports = {
  appName: process.env.APP_NAME || 'eos-api',
  // Port for the app to listen on
  port: process.env.PORT || 1337,
  scraperUrl: process.env.SCRAPER_URL,
  avatarServer: process.env.AVATAR_SERVER,
  // Parameters for our password hashing function
  hash: {
    algorithm: 'sha256',
    saltLength: 16,
    iterations: 5
  },
  hashIds: {
    alphabet: '23456789abcdefghjkmnpqrstuvwxyz'
  },
  s3: {
    uploads: {
      size: process.env.UPLOAD_SIZE_LIMIT,
      key: process.env.S3_API_KEY,
      secret: process.env.S3_UPLOAD_SECRET,
      bucket: process.env.S3_UPLOAD_BUCKET,
      region: process.env.S3_UPLOAD_REGION
    }
  },
  fastly: {
    apiKey: process.env.FASTLY_API_KEY
  },
  mandrillApiKey: process.env.MANDRILL_API_KEY,
  mongo: process.env.MONGO_URL,
  redis: process.env.REDIS_URL || process.env.REDIS_PORT,
  frontEnd: process.env.EMAIL_FRONTEND,
  emailUser: process.env.EMAIL_USER,
  emailPass: process.env.EMAIL_PASS,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleSecret: process.env.GOOGLE_SECRET,
  cleverClientId: process.env.CLEVER_CLIENT_ID,
  cleverClientSecret: process.env.CLEVER_CLIENT_SECRET,
  production: ['production', 'staging', 'ci']
    .indexOf(process.env.NODE_ENV) !== -1
};