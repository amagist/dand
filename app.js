const path = require('path')
const express = require('express')
const session = require('express-session')
const passport = require('passport')
const cookieParser = require('cookie-parser')
const http = require('http')
const RED = require('node-red')
const basicAuth = require('basic-auth')
const bcrypt = require('bcryptjs')

// read settings.js
const OIDsettings = require('./oid-settings.js')
const redAuth = require('./redAuth.js')
const auth = require('./auth.js')

// work around intermediate CA issue
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

const cfenv = require('cfenv')

const VCAP_APPLICATION = JSON.parse(process.env.VCAP_APPLICATION)

// create a new express server
const app = express()

app.use(cookieParser())
app.use(
    session({
        resave: 'true',
        saveUninitialized: 'true',
        secret: 'keyboard cat',
    })
)
app.use(passport.initialize())
app.use(passport.session())

passport.serializeUser(function(user, done) {
    done(null, user)
})

passport.deserializeUser(function(obj, done) {
    done(null, obj)
})

var OpenIDConnectStrategy = require('passport-idaas-openidconnect')
    .IDaaSOIDCStrategy
var Strategy = new OpenIDConnectStrategy(
    {
        authorizationURL: OIDsettings.authorization_url,
        tokenURL: OIDsettings.token_url,
        clientID: OIDsettings.client_id,
        scope: 'openid',
        response_type: 'code',
        clientSecret: OIDsettings.client_secret,
        callbackURL: OIDsettings.callback_url,
        skipUserProfile: true,
        issuer: OIDsettings.issuer_id,
        addCACert: true,
        CACertPathList: ['/oidc_w3id.cer'],
    },
    function(iss, sub, profile, accessToken, refreshToken, params, done) {
        process.nextTick(function() {
            profile.accessToken = accessToken
            profile.refreshToken = refreshToken
            done(null, profile)
        })
    }
)

passport.use(Strategy)

// get the app environment from Cloud Foundry
var appEnv = cfenv.getAppEnv()

// login route
app.get('/login', passport.authenticate('openidconnect', {}))

function bcryptMatch(input, hash) {
    if (bcrypt.compareSync(input, hash)) {
        return true
    } else {
        return false
    }
}
// validate login
function ensureAuthenticated(req, res, next) {
    if (auth.on === 'basic') {
        var credentials = basicAuth(req)

        if (
            !credentials ||
            credentials.name !== auth.username ||
            !bcryptMatch(credentials.pass, auth.password)
            /* bcrypt.hashSync(credentials.pass, 8) !== auth.password */
        ) {
            res.statusCode = 401
            res.setHeader('WWW-Authenticate', 'Basic realm="log in"')
            res.end('Access denied')
        } else {
            return next()
        }
        // end pasted code
    } else if (auth.on === 'w3id') {
        if (!req.isAuthenticated()) {
            req.session.originalUrl = req.originalUrl
            res.redirect('/login')
        } else {
            //  return next();
            next()
        }
    } else {
        return next()
    }
}

// handle callback, if authentication succeeds redirect to original requested url, otherwise go to /failure
app.get('/auth/callback', function(req, res, next) {
    var redirect_url = req.session.originalUrl
    passport.authenticate('openidconnect', {
        successRedirect: redirect_url,
        failureRedirect: '/failure',
    })(req, res, next)
})

// never used - to be removed?
app.get('/logout', function(req, res) {
    req.session.destroy()
    req.logout()
    res.send('Logged out')
})

var REDsettings = {
    mqttReconnectTime: 15000,
    serialReconnectTime: 15000,
    debugMaxLength: 1000,

    // Add the bluemix-specific nodes in
    nodesDir: path.join(__dirname, 'nodes'),

    // Blacklist the non-bluemix friendly nodes
    nodesExcludes: [
        '66-mongodb.js',
        '75-exec.js',
        '35-arduino.js',
        '36-rpi-gpio.js',
        '25-serial.js',
        '28-tail.js',
        '50-file.js',
        '31-tcpin.js',
        '32-udp.js',
        '23-watch.js',
    ],

    // Enable module reinstalls on start-up; this ensures modules installed are restored after a restage
    autoInstallModules: true,

    // paths
    httpAdminRoot: '/red',
    httpNodeRoot: '/',

    // UI
    ui: {
        path: 'ui',
    },

    functionGlobalContext: {},

    storageModule: require('./couchstorage'),
    adminAuth: {
        type: 'credentials',
        users: [
            {
                username: redAuth.username,
                password: redAuth.password, // paste your password hash here
                permissions: '*',
            },
        ],
    },
}

REDsettings.couchAppname = VCAP_APPLICATION['application_name']
var storageServiceName =
    process.env.NODE_RED_STORAGE_NAME ||
    new RegExp('^' + REDsettings.couchAppname + '.Cloudant')
var couchService = appEnv.getService(storageServiceName)

if (!couchService) {
    console.log('Failed to find Cloudant service')
    if (process.env.NODE_RED_STORAGE_NAME) {
        console.log(
            ' - using NODE_RED_STORAGE_NAME environment variable: ' +
                process.env.NODE_RED_STORAGE_NAME
        )
    }
    throw new Error('No cloudant service found')
}
REDsettings.couchUrl = couchService.credentials.url

// Create a server
var server = http.createServer(app)

// Initialise the runtime with a server and settings
RED.init(server, REDsettings)

// Serve the editor UI - must be authenticated
app.use(REDsettings.httpAdminRoot, ensureAuthenticated, RED.httpAdmin)

// Serve the http nodes UI (uncomment following line if you require authenticated endpoint - needed for authenticated dashboard)
app.use(REDsettings.httpNodeRoot, ensureAuthenticated, RED.httpNode)

// failure page (can be overriden within NodeRED)
app.get('/failure', function(req, res) {
    res.send('Login failed')
})

// redirect root to index.html
app.get('/', ensureAuthenticated, function(req, res) {
    res.redirect('/pages/index.html')
})

// serve the files out of ./public as our main files
app.use(express.static(__dirname + '/public'), ensureAuthenticated)

// start server on the specified port and binding host
server.listen(appEnv.port)

// Start NodeRED
RED.start()
