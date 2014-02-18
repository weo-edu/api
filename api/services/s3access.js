

module.exports =  function() {
	var bucket = devMode() ? 'dev.eos.io' : 'eos.io';
	return {
	  "key": "AKIAIMDHEMBP5SULSA3A",
	  "secret": "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",
	  "bucket": bucket
	};
}