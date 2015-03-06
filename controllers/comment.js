var _ = require('lodash');
var Comment = require('../models/Comment');
var JsonResponse = require('../helpers/json/response');
var JsonError = require('../helpers/json/error');

/**
 * GET /comments/:id/:before
 * Load more comments for drink
 */
exports.getMore = function(req, res) {
  var id = req.params.id;
  var before = req.params.before;
  Comment
    .where('drink_id').equals(id)
    .where('posted_at').lt(before)
    .sort({'posted_at': -1})
    .limit(10)
    .exec(function(err, comments) {
      if (err) {
        var jsonResponse = new JsonResponse(new JsonError(err), null);
        return res.status(jsonResponse.status.code).json(jsonResponse);
      }
      if (!comments) {
        var jsonResponse = new JsonResponse(new JsonError(null, 500, 'Could not load comments. Retry perform this action latter. '), null);
        return res.status(jsonResponse.status.code).json(jsonResponse);
      }
      var jsonResponse = new JsonResponse(null, comments);
      return res.status(jsonResponse.status.code).json(jsonResponse);
    });
};
