// grab these from the SSO registration page, paste them in here
exports.client_id = '<%= id %>'
exports.client_secret = '<%= secret %>'
exports.authorization_url =
    'https://w3id.alpha.sso.ibm.com/isam/oidc/endpoint/amapp-runtime-oidcidp/authorize'
exports.token_url =
    'https://w3id.alpha.sso.ibm.com/isam/oidc/endpoint/amapp-runtime-oidcidp/token'
exports.issuer_id = 'https://w3id.alpha.sso.ibm.com/isam'
exports.callback_url = 'https://<%= name %>.w3ibm.mybluemix.net/auth/callback'
