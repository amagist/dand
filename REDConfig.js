const path = require('path'),
    redAuth = require('./redAuth.js'),
    couchStorage = require('./couchstorage.js'),
    _ = require('lodash'),
    moment = require('moment')

exports.REDsettings = {
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

    functionGlobalContext: {
        moment: moment,
        lodash: _,
    },

    storageModule: couchStorage,
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
