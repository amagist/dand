/*eslint-env node*/

//------------------------------------------------------------------------------
// node.js starter application for Bluemix
//------------------------------------------------------------------------------

// This application uses express as its web server
// for more info, see: http://expressjs.com
var express = require('express');
var session = require('express-session');
var passport = require('passport');
var cookieParser = require('cookie-parser');
var fs = require('fs');
var https = require('https');

// read settings.js
var OIDsettings = require('./oid-settings.js');

// work around intermediate CA issue
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

// cfenv provides access to your Cloud Foundry environment
// for more info, see: https://www.npmjs.com/package/cfenv
var cfenv = require('cfenv');

// create a new express server
var app = express();

app.use(cookieParser());
app.use(session({resave: 'true', saveUninitialized: 'true' , secret: 'keyboard cat'}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
	   done(null, user);
});

passport.deserializeUser(function(obj, done) {
	   done(null, obj);
});

var OpenIDConnectStrategy = require('passport-idaas-openidconnect').IDaaSOIDCStrategy;
var Strategy = new OpenIDConnectStrategy({
                 authorizationURL : OIDsettings.authorization_url,
                 tokenURL : OIDsettings.token_url,
                 clientID : OIDsettings.client_id,
                 scope: 'openid',
                 response_type: 'code',
                 clientSecret : OIDsettings.client_secret,
                 callbackURL : OIDsettings.callback_url,
                 skipUserProfile: true,
                 issuer: OIDsettings.issuer_id,
                 addCACert: true,
                 CACertPathList: [
                    '/certs/verisign-root-ca.pem',
                    '/certs/symantec.pem',
                    '/certs/blueidSSL.pem',
                    '/certs/prepiam.toronto.ca.ibm.com.pem']
                 },
         function(iss, sub, profile, accessToken, refreshToken, params, done)  {
	        process.nextTick(function() {
                profile.accessToken = accessToken;
		profile.refreshToken = refreshToken;
		done(null, profile);
	      	})
});

passport.use(Strategy);

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv();

app.get('/', function(req, res) {
	res.send('<h2>Welcome</h2><br /><a href="/hello">userinfo</a><br/><a href="/logout">logout</a>'+'<br /><a href="/">home</a>');
});

app.get('/login', passport.authenticate('openidconnect', {}));

function ensureAuthenticated(req, res, next) {
	if (!req.isAuthenticated()) {
		req.session.originalUrl = req.originalUrl;
		res.redirect('/login');
	} else {
		return next();
	}
}


// handle callback, if authentication succeeds redirect to
// original requested url, otherwise go to /failure
// app.get('/auth/callback', function(req, res, next) {
//	var redirect_url = req.session.originalUrl;
//	passport.authenticate('openidconnect', {
//		successRedirect: redirect_url,
//		failureRedirect: '/failure'
//	})(req,res,next);
// });

// failure page
app.get('/auth/callback', function(req, res) {
	res.send('callback'); });


// failure page
app.get('/failure', function(req, res) {
	res.send('login failed'); });

app.get('/hello', ensureAuthenticated, function(req, res) {
	      var claims = req.user['_json'];
        var html ="<p>Hello " + claims.given_name + " " + claims.family_name + ": </p>";
        html += "<pre>" + JSON.stringify(req.user, null, 4) + "</pre>";
        html += "<hr> <a href=\"/\">home</a>";
	//res.send('Hello '+ claims.given_name + ' ' + claims.family_name + ', your email is ' + claims.email + '<br /> <a href=\'/\'>home</a>');
        res.send(html);
        });


app.get('/logout', function(req,res) {
        req.session.destroy();
        req.logout();
        res.send("Logged out");
     });

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'));

// start server on the specified port and binding host
app.listen(appEnv.port, '0.0.0.0', function() {
  // print a message when the server starts listening
  console.log("server starting on " + appEnv.url);
});
