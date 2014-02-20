/**
 * AnswerController
 *
 * @module		:: Controller
 * @description	:: Contains logic for handling requests.
 */

var mergeModels = require('../../lib/mergeModels')
  , PostController = require('./PostController')
module.exports = mergeModels(PostController, {

  /**
   * Overrides for the settings in `config/controllers.js`
   * (specific to AnswerController)
   */
  _config: {}

});
