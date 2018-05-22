const Generator = require('yeoman-generator')
const bcrypt = require('bcryptjs')

module.exports = class extends Generator {
    constructor(args, opts) {
        super(args, opts)
        this.argument('auth', {type: String, required: false})
        this.config.set('auth', this.options.auth)
    }

    prompting() {
        if (this.config.get('auth') === 'w3id') {
            this.log(
                '\n Auto-config for microsites. First, take a look at the readme.'
            )
            this.log(
                '\n Register your SSO app at https://w3.innovate.ibm.com/tools/sso/home.html, and grab your client ID and secret. You\'ll have to copy in the certificate yourself'
            )
            this.log(
                '\n Note: you can only run an authenticated app on IBM CIO Cloud (w3ibm.mybluemix.net), not on public (at the moment)'
            )
            return this.prompt([
                {
                    type: 'input',
                    name: 'name',
                    message: 'Enter the name of your app',
                    default: 'sample-microsite',
                },
                {
                    type: 'input',
                    name: 'id',
                    message:
                        '(After creating an SSO config) What is your Client ID?',
                },
                {
                    type: 'input',
                    name: 'secret',
                    message:
                        '(After creating an SSO config) What is your Client secret?',
                },
                {
                    type: 'input',
                    name: 'username',
                    message: 'Enter a username for your node-RED editor',
                    default: 'admin',
                },
                {
                    type: 'input',
                    name: 'password',
                    message: 'Enter a password for your node-RED editor',
                    default: 'password',
                },
            ]).then(answers => {
                this.config.save()
                this.config.set('domain', 'w3ibm.mybluemix.net')
                this.config.set(
                    'DB',
                    answers.name + '-Cloudant NoSQL DB Dedicated'
                )
                this.config.set('name', answers.name)
                this.config.set('dedicated', answers.dedicated)
                this.config.set('username', answers.username)
                this.config.set(
                    'password',
                    bcrypt.hashSync(answers.password, 8)
                )
                this.config.set('id', answers.id)
                this.config.set('secret', answers.secret)
                this.config.set('authentication', 'w3id')
            })
        } else if (this.config.get('auth') === 'basic') {
            // do basic auth stuff

            this.log(
                '\n Auto-config for microsites. First, take a look at the readme.'
            )
            this.log('You have selected to run with basic authentication')
            return this.prompt([
                {
                    type: 'input',
                    name: 'name',
                    message: 'Enter the name of your app',
                    default: 'sample-microsite',
                },
                {
                    type: 'confirm',
                    name: 'dedicated',
                    message: 'Will you be running on IBM CIO (private) cloud?',
                },
                {
                    type: 'input',
                    name: 'username',
                    message: 'Enter a username for your node-RED editor',
                    default: 'admin',
                },
                {
                    type: 'input',
                    name: 'password',
                    message: 'Enter a password for your node-RED editor',
                    default: 'password',
                },
                {
                    type: 'input',
                    name: 'siteUsername',
                    message: 'Enter a username for your microsite',
                    default: 'admin',
                },
                {
                    type: 'input',
                    name: 'sitePassword',
                    message: 'Enter a password for your microsite',
                    default: 'password',
                },
            ]).then(answers => {
                if (answers.dedicated) {
                    this.config.set('domain', 'w3ibm.mybluemix.net')
                    this.config.set(
                        'DB',
                        answers.name + '-Cloudant NoSQL DB Dedicated'
                    )
                } else {
                    this.config.set('domain', 'eu-gb.mybluemix.net')
                    this.config.set('DB', answers.name + '-Cloudant NoSQL DB')
                }
                //this.config.save()
                this.config.set('name', answers.name)
                this.config.set('dedicated', answers.dedicated)
                this.config.set('username', answers.username)
                this.config.set(
                    'password',
                    bcrypt.hashSync(answers.password, 8)
                )
                this.config.set('id', 1)
                this.config.set('secret', 1)
                this.config.set('authentication', 'basic')
                this.config.set('siteUsername', answers.siteUsername)
                this.config.set(
                    'sitePassword',
                    bcrypt.hashSync(answers.sitePassword, 8)
                )
            })
            // end basic auth stuff
        } else {
            this.log(
                '\n Auto-config for microsites. First, take a look at the readme.'
            )
            this.log('You have selected to run without authentication')
            return this.prompt([
                {
                    type: 'input',
                    name: 'name',
                    message: 'Enter the name of your app',
                    default: 'sample-microsite',
                },
                {
                    type: 'confirm',
                    name: 'dedicated',
                    message: 'Will you be running on IBM CIO (private) cloud?',
                },
                {
                    type: 'input',
                    name: 'username',
                    message: 'Enter a username for your node-RED editor',
                    default: 'admin',
                },
                {
                    type: 'input',
                    name: 'password',
                    message: 'Enter a password for your node-RED editor',
                    default: 'password',
                },
            ]).then(answers => {
                if (answers.dedicated) {
                    this.config.set('domain', 'w3ibm.mybluemix.net')
                    this.config.set(
                        'DB',
                        answers.name + '-Cloudant NoSQL DB Dedicated'
                    )
                } else {
                    this.config.set('domain', 'eu-gb.mybluemix.net')
                    this.config.set('DB', answers.name + '-Cloudant NoSQL DB')
                }
                this.config.save()
                this.config.set('name', answers.name)
                this.config.set('dedicated', answers.dedicated)
                this.config.set('username', answers.username)
                this.config.set(
                    'password',
                    bcrypt.hashSync(answers.password, 8)
                )
                this.config.set('id', 1)
                this.config.set('secret', 1)
                this.config.set('authentication', false)
            })
        }
    }

    writing() {
        this.fs.copyTpl(
            this.templatePath('manifest.yml'),
            this.destinationPath('./manifest.yml'),
            {
                domain: this.config.get('domain'),
                name: this.config.get('name'),
                service: this.config.get('DB'),
            }
        ) // done creating manifest.yml
        this.fs.copyTpl(
            this.templatePath('oid-settings.js'),
            this.destinationPath('./oid-settings.js'),
            {
                name: this.config.get('name'),
                id: this.config.get('id'),
                secret: this.config.get('secret'),
            }
        ) // done creating OIDC settings
        this.fs.copyTpl(
            this.templatePath('redAuth.js'),
            this.destinationPath('./redAuth.js'),
            {
                username: this.config.get('username'),
                password: this.config.get('password'),
            }
        ) // done creating red auth file
        this.fs.copyTpl(
            this.templatePath('auth.js'),
            this.destinationPath('./auth.js'),
            {
                authentication: this.config.get('authentication'),
                siteUsername: this.config.get('siteUsername'),
                sitePassword: this.config.get('sitePassword'),
            }
        ) // done creating auth file
    }
}
