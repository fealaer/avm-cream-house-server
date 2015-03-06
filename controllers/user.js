var _ = require('lodash');
var async = require('async');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var passport = require('passport');
var User = require('../models/User');
var secrets = require('../config/secrets');
var JsonResponse = require('../helpers/json/response');
var JsonError = require('../helpers/json/error');

/**
 * GET /login
 * Login page.
 */
exports.getLogin = function(req, res) {
  if (req.user) return res.redirect('/');
  res.render('account/login', {
    title: 'Login'
  });
};

/**
 * POST /login
 * Sign in using email and password.
 */
exports.postLogin = function(req, res, next) {
  req.assert('email', 'Email is not valid.').isEmail();
  req.assert('password', 'Password cannot be blank.').notEmpty();

  var errors = req.validationErrors(true);

  if (errors) {
    var jsonResponse = new JsonResponse(new JsonError({name: 'ExpressValidationError', errors: errors}), null);
    return res.status(jsonResponse.status.code).json(jsonResponse);
  }

  passport.authenticate('local', function(err, user, info) {
    if (err) {
      var jsonResponse = new JsonResponse(new JsonError(err), null);
      return res.status(jsonResponse.status.code).json(jsonResponse);
    }
    if (!user) {
      var jsonResponse = new JsonResponse(new JsonError(null, 400, info.message), null);
      return res.status(jsonResponse.status.code).json(jsonResponse);
    }
    req.logIn(user, function(err) {
      if (err) {
        var jsonResponse = new JsonResponse(new JsonError(err), null);
        return res.status(jsonResponse.status.code).json(jsonResponse);
      } else {
        var jsonResponse = new JsonResponse(null, user);
        return res.status(jsonResponse.status.code).json(jsonResponse);
      }
    });
  })(req, res, next);
};

/**
 * GET /logout
 * Log out.
 */
exports.logout = function(req, res) {
  req.logout();
  var jsonResponse = new JsonResponse(null, {});
  return res.status(jsonResponse.status.code).json(jsonResponse);
};

/**
 * GET /signup
 * Signup page.
 */
exports.getSignup = function(req, res) {
  if (req.user) return res.redirect('/');
  res.render('account/signup', {
    title: 'Create Account'
  });
};

/**
 * POST /signup
 * Create a new local account.
 */
exports.postSignup = function(req, res, next) {
  req.assert('email', 'Email is not valid.').isEmail();
  req.assert('password', 'Password must be at least 4 characters long.').len(4);
  req.assert('confirmPassword', 'Passwords do not match.').equals(req.body.password);

  var errors = req.validationErrors(true);

  if (errors) {
    var jsonResponse = new JsonResponse(new JsonError({name: 'ExpressValidationError', errors: errors}), null);
    return res.status(jsonResponse.status.code).json(jsonResponse);
  }

  var user = new User({
    email: req.body.email,
    password: req.body.password,
    profile: {
      name: req.body.name
    }
  });

  User.findOne({ email: req.body.email }, function(err, existingUser) {
    if (existingUser) {
      var jsonResponse = new JsonResponse(new JsonError(null, 400, 'Account with this email address already exists.'), null);
      return res.status(jsonResponse.status.code).json(jsonResponse);
    }
    user.save(function(err) {
      if (err) {
        var jsonResponse = new JsonResponse(new JsonError(err), null);
        return res.status(jsonResponse.status.code).json(jsonResponse);
      }
      req.logIn(user, function(err) {
        if (err) {
          var jsonResponse = new JsonResponse(new JsonError(err), null);
          return res.status(jsonResponse.status.code).json(jsonResponse);
        } else {
          var transporter = nodemailer.createTransport({
            service: 'Mandrill',
            auth: {
              user: secrets.mandrill.user,
              pass: secrets.mandrill.password
            }
          });
          var mailOptions = {
            to: user.email,
            from: 'avm.cream.house.cafe@gmail.com',
            subject: 'Thank you for registering with AVM Cream House application!',
            text: 'Hello, ' + user.profile.name + '\n\n' +
              'This is a confirmation that you have successfully registered with AVM Cream House application!\n\n' +
              'We hope that this application will help you to choose your next drink and discover new flavors and fruits!'
          };
          transporter.sendMail(mailOptions, function(err) {
            if (err) {
              console.log(err);
            }
          });
          var jsonResponse = new JsonResponse(null, user);
          return res.status(jsonResponse.status.code).json(jsonResponse);
        }
      });
    });
  });
};

/**
 * POST /save/drink
 * Save drink
 */
exports.saveDrink = function (req, res) {
  User.findById(req.user.id, function (err, user) {
    if (err) {
      var jsonResponse = new JsonResponse(new JsonError(err), null);
      return res.status(jsonResponse.status.code).json(jsonResponse);
    }

    if (req.body.isSaved) {
      user.saved.remove(req.body.id);
    } else {
      user.saved.push(req.body.id);
    }

    user.save(function(err, user) {
      if (err) {
        var jsonResponse = new JsonResponse(new JsonError(err), null);
        return res.status(jsonResponse.status.code).json(jsonResponse);
      }
      var jsonResponse = new JsonResponse(null, user);
      return res.status(jsonResponse.status.code).json(jsonResponse);
    });
  });
};

/**
 * GET /account
 * Profile page.
 */
exports.getAccount = function(req, res) {
  res.render('account/profile', {
    title: 'Account Management'
  });
};

/**
 * GET /account/profile
 * Profile data.
 */
exports.getAccountProfile = function(req, res) {
  User.findById(req.user.id, function(err, user) {
    if (err) {
      var jsonResponse = new JsonResponse(new JsonError(err), null);
      return res.status(jsonResponse.status.code).json(jsonResponse);
    }
    var jsonResponse = new JsonResponse(null, user);
    return res.status(jsonResponse.status.code).json(jsonResponse);
  });
};

/**
 * POST /account/profile
 * Update profile information.
 */
exports.postUpdateProfile = function(req, res, next) {
  User.findById(req.user.id, function(err, user) {
    if (err) return next(err);
    user.email = req.body.email || '';
    user.profile.name = req.body.name || '';
    user.profile.gender = req.body.gender || '';
    user.profile.location = req.body.location || '';
    user.profile.website = req.body.website || '';

    user.save(function(err) {
      if (err) return next(err);
      req.flash('success', { msg: 'Profile information updated.' });
      res.redirect('/account');
    });
  });
};

/**
 * POST /account/password
 * Update current password.
 */
exports.postUpdatePassword = function(req, res, next) {
  req.assert('password', 'Password must be at least 4 characters long.').len(4);
  req.assert('confirmPassword', 'Passwords do not match.').equals(req.body.password);

  var errors = req.validationErrors();

  if (errors) {
    req.flash('errors', errors);
    return res.redirect('/account');
  }

  User.findById(req.user.id, function(err, user) {
    if (err) return next(err);

    user.password = req.body.password;

    user.save(function(err) {
      if (err) return next(err);
      req.flash('success', { msg: 'Password has been changed.' });
      res.redirect('/account');
    });
  });
};

/**
 * POST /account/delete
 * Delete user account.
 */
exports.postDeleteAccount = function(req, res, next) {
  User.remove({ _id: req.user.id }, function(err) {
    if (err) return next(err);
    req.logout();
    req.flash('info', { msg: 'Your account has been deleted.' });
    res.redirect('/');
  });
};

/**
 * GET /account/unlink/:provider
 * Unlink OAuth provider.
 */
exports.getOauthUnlink = function(req, res, next) {
  var provider = req.params.provider;
  User.findById(req.user.id, function(err, user) {
    if (err) return next(err);

    user[provider] = undefined;
    user.tokens = _.reject(user.tokens, function(token) { return token.kind === provider; });

    user.save(function(err) {
      if (err) return next(err);
      req.flash('info', { msg: provider + ' account has been unlinked.' });
      res.redirect('/account');
    });
  });
};

/**
 * GET /reset/:token
 * Reset Password page.
 */
exports.getReset = function(req, res) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  User
    .findOne({ resetPasswordToken: req.params.token })
    .where('resetPasswordExpires').gt(Date.now())
    .exec(function(err, user) {
      if (!user) {
        req.flash('errors', { msg: 'Password reset token is invalid or has expired.' });
        return res.redirect('/forgot');
      }
      res.render('account/reset', {
        title: 'Password Reset'
      });
    });
};

/**
 * POST /reset/:token
 * Process the reset password request.
 */
exports.postReset = function(req, res, next) {
  req.assert('token', 'Token cannot be blank.').notEmpty();
  req.assert('password', 'Password must be at least 4 characters long.').len(4);
  req.assert('confirm', 'Passwords do not match.').equals(req.body.password);

  var errors = req.validationErrors();

  if (errors) {
    var jsonResponse = new JsonResponse(new JsonError({name: 'ExpressValidationError', errors: errors}), null);
    return res.status(jsonResponse.status.code).json(jsonResponse);
  }

  async.waterfall([
    function(done) {
      User
        .findOne({ resetPasswordToken: req.body.token })
        .where('resetPasswordExpires').gt(Date.now())
        .exec(function(err, user) {
          if (!user) {
            var jsonResponse = new JsonResponse(new JsonError(null, 400, 'Password reset token is invalid or has expired.'), null);
            return res.status(jsonResponse.status.code).json(jsonResponse);
          }

          user.password = req.body.password;
          user.resetPasswordToken = undefined;
          user.resetPasswordExpires = undefined;

          user.save(function(err) {
            if (err) {
              var jsonResponse = new JsonResponse(new JsonError(err), null);
              return res.status(jsonResponse.status.code).json(jsonResponse);
            }
            req.logIn(user, function(err) {
              done(err, user);
            });
          });
        });
    },
    function(user, done) {
      var transporter = nodemailer.createTransport({
        service: 'Mandrill',
        auth: {
          user: secrets.mandrill.user,
          pass: secrets.mandrill.password
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'avm.cream.house.cafe@gmail.com',
        subject: 'Your AVM Cream House password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      transporter.sendMail(mailOptions, function(err) {
        done(err, 'done');
      });
    }
  ], function(err, result) {
    if (err) {
      var jsonResponse = new JsonResponse(new JsonError(err), null);
      return res.status(jsonResponse.status.code).json(jsonResponse);
    }
    var jsonResponse = new JsonResponse(null, {message: 'Your password has been changed.'});
    return res.status(jsonResponse.status.code).json(jsonResponse);
  });
};

/**
 * GET /forgot
 * Forgot Password page.
 */
exports.getForgot = function(req, res) {
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  res.render('account/forgot', {
    title: 'Forgot Password'
  });
};

/**
 * POST /forgot
 * Create a random token, then the send user an email with a reset link.
 */
exports.postForgot = function(req, res, next) {
  req.assert('email', 'Email is not valid.').isEmail();

  var errors = req.validationErrors();

  if (errors) {
    var jsonResponse = new JsonResponse(new JsonError({name: 'ExpressValidationError', errors: errors}), null);
    return res.status(jsonResponse.status.code).json(jsonResponse);
  }

  async.waterfall([
    function(done) {
      crypto.randomBytes(16, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email.toLowerCase() }, function(err, user) {
        if (!user) {
          var jsonResponse = new JsonResponse(new JsonError(null, 400, 'No account with this email address exists.'), null);
          return res.status(jsonResponse.status.code).json(jsonResponse);
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var transporter = nodemailer.createTransport({
        service: 'Mandrill',
        auth: {
          user: secrets.mandrill.user,
          pass: secrets.mandrill.password
        }
      });
      var mailOptions = {
        to: user.email,
        from: 'avm.cream.house.cafe@gmail.com',
        subject: 'Reset your password on AVM Cream House',
        text: 'You are receiving this email because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please copy and paste this token into token field in your application to complete the process:\n\n' +
          '\t\t\ttoken: ' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      transporter.sendMail(mailOptions, function(err) {
        done(err, 'done');
      });
    }
  ], function(err, result) {
    if (err) {
      var jsonResponse = new JsonResponse(new JsonError(err), null);
      return res.status(jsonResponse.status.code).json(jsonResponse);
    }
    var jsonResponse = new JsonResponse(null, {message: 'An e-mail has been sent to your email with further instructions.'});
    return res.status(jsonResponse.status.code).json(jsonResponse);
  });
};