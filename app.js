const express = require('express'),
    session = require('express-session'),
    passport = require('passport'),
    cookieParser = require('cookie-parser'),
    http = require('http'),
    RED = require('node-red'),
    basicAuth = require('basic-auth'),
    bcrypt = require('bcryptjs'),
    OIDsettings = require('./oid-settings.js'),
    auth = require('./auth.js'),
    cfenv = require('cfenv'),
    passportIdaas = require('passport-idaas-openidconnect'),
    REDConfig = require('./REDConfig.js'),
    app = express(),
    VCAP_APPLICATION = JSON.parse(process.env.VCAP_APPLICATION),
    appEnv = cfenv.getAppEnv(),
    OpenIDConnectStrategy = passportIdaas.IDaaSOIDCStrategy

let Strategy = new OpenIDConnectStrategy(
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

// work around intermediate CA issue
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

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

passport.use(Strategy)

function bcryptMatch(input, hash) {
    if (bcrypt.compareSync(input, hash)) {
        return true
    } else {
        return false
    }
}

function ensureAuthenticated(req, res, next) {
    if (auth.type === 'basic') {
        let credentials = basicAuth(req)
        if (
            !credentials ||
            credentials.name !== auth.username ||
            !bcryptMatch(credentials.pass, auth.password)
        ) {
            res.statusCode = 401
            res.setHeader('WWW-Authenticate', 'Basic realm="log in"')
            res.end('Access denied')
        } else {
            return next()
        }
    } else if (auth.type === 'w3id') {
        if (!req.isAuthenticated()) {
            req.session.originalUrl = req.originalUrl
            res.redirect('/login')
        } else {
            next()
        }
    } else {
        return next()
    }
}

// app.get routes
app.get('/auth/callback', function(req, res, next) {
    let redirect_url = req.session.originalUrl
    passport.authenticate('openidconnect', {
        successRedirect: redirect_url,
        failureRedirect: '/failure',
    })(req, res, next)
})
app.get('/failure', function(req, res) {
    res.send('Login failed - not authorised')
})
app.get('/login', passport.authenticate('openidconnect', {}))

let REDsettings = REDConfig.REDsettings
REDsettings.couchAppname = VCAP_APPLICATION['application_name']
let storageServiceName =
    process.env.NODE_RED_STORAGE_NAME ||
    new RegExp('^' + REDsettings.couchAppname + '.Cloudant')
let couchService = appEnv.getService(storageServiceName)
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

// Create a server, initialise routes, start nodeRED
const server = http.createServer(app)
RED.init(server, REDsettings)
app.use(REDsettings.httpAdminRoot, ensureAuthenticated, RED.httpAdmin)
app.use(REDsettings.httpNodeRoot, ensureAuthenticated, RED.httpNode)
app.use(ensureAuthenticated)
app.use(express.static(__dirname + '/public'))
server.listen(appEnv.port)
RED.start()
