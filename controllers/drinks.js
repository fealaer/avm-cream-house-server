var _ = require('lodash');
var Drink = require('../models/Drink');
var User = require('../models/User');
var Comment = require('../models/Comment');
var JsonResponse = require('../helpers/json/response');
var JsonError = require('../helpers/json/error');

/**
 * GET /drinks
 * Load all drinks
 */
exports.getDrinks = function (req, res) {
  Drink
    .find({}, {_id: 0})
    .sort({id: 1})
    .exec(function (err, drinks) {
      if (err) {
        var jsonResponse = new JsonResponse(new JsonError(err), null);
        return res.status(jsonResponse.status.code).json(jsonResponse);
      }
      if (!drinks) {
        var jsonResponse = new JsonResponse(new JsonError(null, 500, 'Could not load drinks. Retry perform this action latter. '), null);
        return res.status(jsonResponse.status.code).json(jsonResponse);
      }
      var jsonResponse = new JsonResponse(null, drinks);
      return res.status(jsonResponse.status.code).json(jsonResponse);
    });
};

/**
 * POST /drinks/rate
 * Rate drink
 */
exports.rateDrink = function (req, res) {
  Drink.findOne({ id: req.body.id }, function (err, drink) {
    if (err) {
      var jsonResponse = new JsonResponse(new JsonError(err), null);
      return res.status(jsonResponse.status.code).json(jsonResponse);
    }
    if (!drink) {
      var jsonResponse = new JsonResponse(new JsonError(null, 400, 'Could not find drink with id \'' + req.body.id + '\'. '), null);
      return res.status(jsonResponse.status.code).json(jsonResponse);
    }
    User.findById(req.user.id, function (err, user) {
      if (err) {
        var jsonResponse = new JsonResponse(new JsonError(err), null);
        return res.status(jsonResponse.status.code).json(jsonResponse);
      }

      if (req.body.comment) {
        drink.totalComments++;
        var rawComment = {
          drink_id: req.body.id,
          comment: req.body.comment,
          posted_at: new Date(),
          profile: {
            email: user.email,
            name: user.profile.name,
            picture: user.profile.picture
          }
        };
        if (drink.totalComments > 10) {
          drink.comments.pop();
        }
        drink.comments.unshift(rawComment);
        var comment = new Comment(rawComment);
        comment.save(function (err) {
          if (err) {
            var jsonResponse = new JsonResponse(new JsonError(err), null);
            return res.status(jsonResponse.status.code).json(jsonResponse);
          }
        });
      }
      drink.rate.based++;
      switch (req.body.rate) {
        case 1:
          drink.rate.ratings.one++;
          break;
        case 2:
          drink.rate.ratings.two++;
          break;
        case 3:
          drink.rate.ratings.three++;
          break;
        case 4:
          drink.rate.ratings.four++;
          break;
        case 5:
          drink.rate.ratings.five++;
          break;
      }
      drink.rate.ratings[req.body.rate]++;
      var ratings = drink.rate.ratings;
      drink.rate.rate = (ratings['one'] + ratings['two'] * 2 + ratings['three'] * 3 + ratings['four'] * 4 + ratings['five'] * 5) / drink.rate.based;
      
      user.tried.push(req.body.id);
      
      user.save(function(err, user) {
        if (err) {
          var jsonResponse = new JsonResponse(new JsonError(err), null);
          return res.status(jsonResponse.status.code).json(jsonResponse);
        }
      });
      
      drink.save(function(err, drink) {
        if (err) {
          var jsonResponse = new JsonResponse(new JsonError(err), null);
          return res.status(jsonResponse.status.code).json(jsonResponse);
        }
        var jsonResponse = new JsonResponse(null, drink);
        return res.status(jsonResponse.status.code).json(jsonResponse);
      });
    });
  });
};