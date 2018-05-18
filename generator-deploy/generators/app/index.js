var Generator = require('yeoman-generator');
module.exports = class extends Generator {
  writing() {
      this.fs.copyTpl(
        this.templatePath('index.html'),
        this.destinationPath('./../public/index.html'),
        { title: 'Templating with Yeoman' }
      );
    }
/*  prompting() {
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
      }, {
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
        this.log('app name: ', answers.name);
        this.log('dedicated: ', answers.dedicated);
        this.log('username: ', answers.username);
        this.log('password: ', answers.password);
        this.log(require('bcryptjs').hashSync(answers.password, 8))
      }

    });
  }
*/
};
