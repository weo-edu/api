/**
 * Default 500 (Server Error) middleware
 *
 * If an error is thrown in a policy or controller,
 * Sails will respond using this default error handler
 *
 * This middleware can also be invoked manually from a controller or policy:
 * res.serverError( [errors] )
 *
 *
 * @param {Array|Object|String} errors
 *      optional errors
 */

module.exports[500] = function serverErrorOccurred(errors, req, res) {

  /*
   * NOTE: This function is Sails middleware-- that means that not only do `req` and `res`
   * work just like their Express equivalents to handle HTTP requests, they also simulate
   * the same interface for receiving socket messages.
   */
  var viewFilePath = '500',
      statusCode = 500,
      i, errorToLog, errorToJSON;

  var result = {
    status: statusCode
  };
  // Normalize a {String|Object|Error} or array of {String|Object|Error}
  // into an array of proper, readable {Error}
  var errorsToDisplay = sails.util.normalizeErrors(errors);
  for (i in errorsToDisplay) {

    // Log error(s) as clean `stack`
    // (avoids ending up with \n, etc.)
    if ( errorsToDisplay[i].original ) {
      errorToLog = sails.util.inspect(errorsToDisplay[i].original);
    }
    else {
      errorToLog = errorsToDisplay[i].stack;
    }
    // Use original error if it exists
    errorToJSON = errorsToDisplay[i].original || errorsToDisplay[i];
    errorsToDisplay[i] = errorToJSON;

    if(errorsToDisplay[i].name === 'MongoError'
        && errorsToDisplay[i].code === 11000) {
      function parseDupKeyMessage(msg) {
        var re = /^E11000 duplicate key error index\: (\w+)\.(\w+)\.\$([\w\$]+)  dup key\: \{ \: \"(.*)\" \}$/;
        var parts = re.exec(msg);
        if(parts && parts.length > 1) {
          return {
            db: parts[1],
            collection: parts[2],
            index: parts[3],
            data: parts[4]
          };
        }
      }

      var info = parseDupKeyMessage(errorsToDisplay[i].message);
      if(info) {
        sails.adapters['sails-mongo'].native(info.collection, function(err, col) {
          if(err) throw err;
          col.indexInformation(function(err, indexInfo) {
            if(err) throw err;
            var index = indexInfo[info.index]
              , error = {ValidationError: {}};

            // index = [[<fieldName>, <direction>]]
            _.each(index, function(field) {
              field = field[0];
              error.ValidationError[field] = [{
                data: info.data,
                message: 'Validation error: ' + field + ' is not unique',
                rule: 'unique'
              }];
            });

            sails.config[500](error, req, res);
          });
        });
        // Error transformation is async, so we need to skip reporting
        // for now
        return;
      }
    }

    if(! errorsToDisplay[i].ValidationError) {
      sails.log.error('Server Error (500)');
      sails.log.error(errorToLog);
    }
  }

  if(errorsToDisplay[0].ValidationError) {
    var resource = req.path.split('/')[1];
    res.clientError('ValidationError')
      .fromSails(resource, errorsToDisplay)
      .send(400);
  } else {
    // Only include errors if application environment is set to 'development'
    // In production, don't display any identifying information about the error(s)
    if (sails.config.environment === 'development') {
      result.errors = errorsToDisplay;
    }

    // If the user-agent wants JSON, respond with JSON
    //if (req.wantsJSON) {
    return res.json(result, result.status);
    //}
  }

  // Set status code and view locals
  // res.status(result.status);
  // for (var key in result) {
  //   res.locals[key] = result[key];
  // }
  // // And render view
  // res.render(viewFilePath, result, function (err) {
  //   // If the view doesn't exist, or an error occured, just send JSON
  //   if (err) { return res.json(result, result.status); }

  //   // Otherwise, if it can be rendered, the `views/500.*` page is rendered
  //   res.render(viewFilePath, result);
  // });

};
