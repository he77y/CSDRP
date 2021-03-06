var express = require('express');
var router = express.Router();
var passport = require('passport');
var auth = require('../config/auth');
var expressJwt = require('express-jwt');

var loginactions = require('../methods/loginactions');

// var user = require('../model/user');

//User related routes
router.post('/loginAuthenticate', loginactions.loginAuthenticate);
router.post('/addNewUser', loginactions.addNewUser);
router.get('/getinfo', loginactions.getinfo);
router.get('/getallusers' , loginactions.getallusers);
router.delete('/deleteuser/:id',loginactions.deleteuser);


    // route for login form
    // route for processing the login form
    // route for signup form
    // route for processing the signup form

    // route for showing the profile page
    router.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            user : req.user // get the user out of session and pass to template
        });
    });

        // route for logging out
    router.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

// =====================================
    // TWITTER ROUTES ======================
    // =====================================
//     router.get('/auth/twitter', 
//     passport.authenticate('twitter'),
//     function(req, res) {}); // empty route handler function, it won't be triggered
router.get('/auth/twitter/callback', 
    passport.authenticate('twitter', { 
                           failureRedirect: '/twittererror' }),
    function(req, res) {}); // route handler

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}
var createToken = function(auth) {
    return jwt.sign({
      id: auth.id
    }, 'my-secret',
    {
      expiresIn: 60 * 120
    });
  };
  
  var generateToken = function (req, res, next) {
    req.token = createToken(req.auth);
    return next();
  };
  
  var sendToken = function (req, res) {
    res.setHeader('x-auth-token', req.token);
    return res.status(200).send(JSON.stringify(req.user));
  };
  
  router.route('/auth/twitter/reverse')
    .post(function(req, res) {
      request.post({
        url: 'https://api.twitter.com/oauth/request_token',
        oauth: {
          oauth_callback: "http%3A%2F%2Flocalhost%3A3000%2Ftwitter-callback",
          consumer_key: twitterConfig.consumerKey,
          consumer_secret: twitterConfig.consumerSecret
        }
      }, function (err, r, body) {
        if (err) {
          return res.send(500, { message: e.message });
        }
  
        var jsonStr = '{ "' + body.replace(/&/g, '", "').replace(/=/g, '": "') + '"}';
        res.send(JSON.parse(jsonStr));
      });
    });
  
  router.route('/auth/twitter')
    .post((req, res, next) => {
      request.post({
        url: `https://api.twitter.com/oauth/access_token?oauth_verifier`,
        oauth: {
          consumer_key: auth.twitterAuth.consumerKey,
          consumer_secret: auth.twitterAuth.consumerSecret,
          token: req.query.oauth_token
        },
        form: { oauth_verifier: req.query.oauth_verifier }
      }, function (err, r, body) {
        if (err) {
          return res.send(500, { message: err.message });
        }
  
        const bodyString = '{ "' + body.replace(/&/g, '", "').replace(/=/g, '": "') + '"}';
        const parsedBody = JSON.parse(bodyString);
  
        req.body['oauth_token'] = parsedBody.oauth_token;
        req.body['oauth_token_secret'] = parsedBody.oauth_token_secret;
        req.body['user_id'] = parsedBody.user_id;
  
        next();
      });
    }, passport.authenticate('twitter-token', {session: false}), function(req, res, next) {
        if (!req.user) {
          return res.send(401, 'User Not Authenticated');
        }
  
        // prepare token for API
        req.auth = {
          id: req.user.id
        };
  
        return next();
      }, generateToken, sendToken);
  
  //token handling middleware
  var authenticate = expressJwt({
    secret: 'my-secret',
    requestProperty: 'auth',
    getToken: function(req) {
      if (req.headers['x-auth-token']) {
        return req.headers['x-auth-token'];
      }
      return null;
    }
  });
  
  var getCurrentUser = function(req, res, next) {
    User.findById(req.auth.id, function(err, user) {
      if (err) {
        next(err);
      } else {
        req.user = user;
        next();
      }
    });
  };
  
  var getOne = function (req, res) {
    var user = req.user.toObject();
  
    delete user['twitterProvider'];
    delete user['__v'];
  
    res.json(user);
  };
  
  router.route('/auth/me')
    .get(authenticate, getCurrentUser, getOne);
  

module.exports = router;