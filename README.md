# IBM Rapid Prototyping Microsite Template

Deploys a microsite using the RPT's methodologies, allowing you to get a site running as fast as possible. Built with Mobirise, hosted on IBM Cloud. There's also an option to authenticate users using w3id, and a node-RED instance to help you deploy additional services such as a Cloudant Database, or a chatbot. There's a yeoman generator to take out the hard work of configuring it all, all you need to do is drag 'n' drop some html.

## Step 0 - Fork this Repo, and some pre-reqs

1.  On GitHub, fork this repo, then clone it onto your local machine. (Or just manually copy the files into a blank repo if you're using the Rapid Prototyping Organisation on GitHub).
2.  Install necessary tools: `Cloud Foundry CLI`, `node` & `npm` - see bottom of this doc for links. If you're not sure what's installed, run `node -v` and `npm -v` to check if they're installed.
3.  Run `npm install -g yo`
4.  From the `generator-deploy` directory of this repo, run `npm link` (this is a temporary workaround for the yeoman script). Once you've done this, navigate back to the root directory or you'll forget later
5.  Run `npm install` to install all the packages locally (cloud Foundry will do this for the IBM Cloud app for you)
6.  Think of a unique app name for your bluemix route. Something like _client-name_-microsite would work.
7.  Log into to Cloud Foundry with `cf login --sso`. Make sure you're in the same location (api, space, account, region) as where you plan to put the microsite. (Do this bit now as there's some auto-config here that relies on you being logged in)

## Step 1 - Generate some HTML

1.  [Download Mobirise](http://mobirise.com/)
2.  Fire it up, and drag & drop components in the builder until you've got a site. Additional pages can be added too.
3.  Click `Publish` on the top right, then select Local Drive Folder. Choose the `public` folder of the repo you just cloned. This will dump all html, stylesheets, and images into this repository. Make sure you have turned off "Publish changes only" option when redeploying code

(note: You can manually create html, or use another site builder, as long as the links are all relative and you have an index.html as the root)

## Step 2 - Set up Authentication (if using it)

There's 3 options here:

- w3id authentication - for use when the IBM Intranet id& password is needed to secure. Only available to IBMers

  - Register Bluemix route at [https://w3.innovate.ibm.com/tools/sso/home.html](https://w3.innovate.ibm.com/tools/sso/home.html) as an OpenIDConnect service (For the callback URL, register as `<Bluemix route>/auth/callback`)
  - To test, use of the w3id Staging service is recommended, this uses the live directory but not the live OpenIDConnect service
  - Download the certificate supplied as `oidc_w3id.cer` and upload to the root directory of this repo
  - Keep a note of your Client ID and secret, you'll need it later

- Basic authentication - simple username & password (securely hashed). Best for client stuff or those without IBM/w3IDs

  - think of a username and suitable password, for use in step 3

- No authentication - website will be publically accessible if on public IBM Cloud, or accessible to anyone behind the IBM firewall if on CIO (private Cloud)

## Step 3 - Yeoman Generator

0.  Make sure you're logged into Cloud Foundry (you should've done this in step 0)
1.  Run `yo deploy` (for no authentication) or `yo deploy w3id` (for w3id authentication), or `yo deploy basic` (for basic authentication) from the root directory of this repo (it won't work anywhere else).
1.  Follow the instructions, entering your information when asked
1.  This will create several files, taking the hassle out of configuring the authentication and node-RED setup yourself. This will also spin up a CloudantDB instance for node-RED to connect to
1.  Use the cf command line tools to deploy - `cf push`- This will deploy your app in your area, connecting to the DB you've set up.

## Step 4 - Done!

You're done! Now you should have a site live at your URL, either with or without authentication, and with node-RED. Use the `/red` route to get to the editor.
Note: In some instances we've noticed node-RED does not properly start first time. Run `cf restage <appname>` and it will work.

If you've enabled authentication, all mobirise pages will be protected by w3id. If you want to protect node-RED routes, dump this subflow directly after a HTTP in node:

```
  [{"id":"5b7ea8bf.70a15","type":"subflow","name":"w3id login","info":"This node checks to see if the user is logged in.\nIf not, it stores the original URL and redirects\nto /login. On a successful return, it resumes at\nthe stored URL","in":[{"x":52.5,"y":48,"wires":[{"id":"a6b19b7c.903648"}]}],"out":[{"x":399,"y":122,"wires":[{"id":"a6b19b7c.903648","port":1}]}]},{"id":"a6b19b7c.903648","type":"switch","z":"5b7ea8bf.70a15","name":"User null?","property":"req.user","propertyType":"msg","rules":[{"t":"null"},{"t":"else"}],"checkall":"true","outputs":2,"x":171.5,"y":48,"wires":[["d836655d.df5988"],[]]},{"id":"d836655d.df5988","type":"change","z":"5b7ea8bf.70a15","name":"Redirect to login","rules":[{"t":"set","p":"req.session.originalUrl","pt":"msg","to":"req.originalUrl","tot":"msg"},{"t":"set","p":"statusCode","pt":"msg","to":"307","tot":"num"},{"t":"set","p":"headers.location","pt":"msg","to":"/login","tot":"str"}],"action":"","property":"","from":"","to":"","reg":false,"x":392,"y":42,"wires":[["9acba24b.369168"]]},{"id":"9acba24b.369168","type":"http response","z":"5b7ea8bf.70a15","name":"","x":581.5,"y":42.75,"wires":[]}]
```

## Help/resources

### Contacts

[Tom Sherlock](mailto:tsherloc@uk.ibm.com)

### Programs to install (if not already on machine)

[Node.js](https://nodejs.org/en/download/)
[Cloud Foundry CLI](https://docs.cloudfoundry.org/cf-cli/install-go-cli.html)

### Reference guides

[Embedded node-RED](https://nodered.org/docs/embedding)  
[yeoman](http://yeoman.io/)
