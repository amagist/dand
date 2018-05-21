var Generator = require('yeoman-generator');
module.exports = class extends Generator {
  prompting() {
    this.log("\n Auto-config for microsites. First, take a look at the readme.")
    this.log("\n If using authentication, register your SSO app at https://w3.innovate.ibm.com/tools/sso/home.html, and grab your client ID and secret. You'll have to copy in the certificate yourself")
    this.log('\n Note: you can only run an authenticated app on IBM CIO Cloud (w3ibm.mybluemix.net), not on public (at the moment)')
    return this.prompt([{
      type: 'input',
      name: 'name',
      message: 'Enter the name of your app',
      default: 'sample-microsite'
    }, {
      type: 'confirm',
      name: 'dedicated',
      message: 'Will you be running on IBM CIO (private) cloud?'
    }, {
      type: 'confirm',
      name: 'authentication',
      message: 'Will you be requiring authenticated endpoints?'
    },
    {
      type: 'input',
      name: 'id',
      message: '(After creating an SSO config) What is your Client ID? (leave blank if not authenticating)'
    }, {
      type: 'input',
      name: 'secret',
      message: '(After creating an SSO config) What is your Client secret? (leave blank if not authenticating)'
    },
    {
      type: 'input',
      name: 'username',
      message: 'Enter a username for your node-RED editor',
      default: 'admin'
    },
    {
      type: 'input',
      name: 'password',
      message: 'Enter a password for your node-RED editor',
      default: 'password'
    }

    ]).then((answers) => {
      if (!answers.dedicated && answers.authentication) {
        this.log("This isn't possible. I'll add some proper error handling in here at some point, but until then, restart the script - either it needs to run on w3 Bluemix with authentication, or on public with no authentication")
      } else {
        if (answers.dedicated) {
          this.config.set("domain", "w3ibm.mybluemix.net")
          this.config.set("DB", (answers.name + "-Cloudant NoSQL DB Dedicated"))
        } else {
          this.config.set("domain", "eu-gb.mybluemix.net")
          this.config.set("DB", (answers.name + "-Cloudant NoSQL DB"))
        }
        this.config.save()
        this.config.set("name", answers.name)
        this.config.set("dedicated", answers.dedicated)
        this.config.set("username", answers.username)
        this.config.set("password", require('bcryptjs').hashSync(answers.password, 8))
        this.config.set("id", answers.id)
        this.config.set("secret", answers.secret)
        this.config.set("authentication", answers.authentication)
      }
    });
  }
  writing() {
    this.fs.copyTpl(
      this.templatePath('manifest.yml'),
      this.destinationPath('./manifest.yml'), {
        domain: this.config.get('domain'),
        name: this.config.get('name'),
        service: this.config.get('DB')
      }
    ); // done creating manifest.yml
    this.fs.copyTpl(
      this.templatePath('oid-settings.js'),
      this.destinationPath('./oid-settings.js'), {
        name: this.config.get('name'),
        id: this.config.get('id'),
        secret: this.config.get('secret')
      }
    ); // done creating OIDC settings
    this.fs.copyTpl(
      this.templatePath('redAuth.js'),
      this.destinationPath('./redAuth.js'), {
        username: this.config.get('username'),
        password: this.config.get('password'),
      }
    ); // done creating red auth file
    this.fs.copyTpl(
      this.templatePath('auth.js'),
      this.destinationPath('./auth.js'), {
        authentication: this.config.get('authentication'),
      }
    ); // done creating auth file
  }
};
