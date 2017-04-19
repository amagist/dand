# NodeRED authenticated through w3id

This repository deploys a NodeRED instance which is authenticated via w3id (and therefore will work only inside the IBM firewall).

## To deploy:

1. Decide on app name and route on Bluemix
2. Register Bluemix route at https://w3.innovate.ibm.com/tools/sso/home.html as an OpenIDConnect service
3. For the call back URL, register as `<Bluemix route>/auth/callback`
4. To test, use of the w3id Staging service is recommended, this uses the live directory but not the live OpenIDConnect service
5. Download the certificate supplied as `oidc_w3id.cer` and upload to main directory of repo
6. Update `oid-settings.js` with the configuration settings supplied by the sso registration service
7. Deploy repo

Note that as standard, the `/red` route for the editor is authenticated, but the routes for the `http in` nodes are not (which means the dashboard is not authenticated). Authentication of `http in` nodes can be done within the NodeRED editor if required, or can be hardcoded by following the instructions in the comments in `app.js`
