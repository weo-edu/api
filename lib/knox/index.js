var knox = require('knox');
module.exports = knox.createClient({
  key: "AKIAIMDHEMBP5SULSA3A",
  secret: "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",
  bucket: 'avatar.eos.io',
  region: 'us-west-1'
});