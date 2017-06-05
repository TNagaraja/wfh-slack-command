var GoogleAuth = require('google-auth-library');

module.exports = {
	credentials: function(email, key) {
		var pending;
		if (!pending) {
			pending = new Promise((resolve, reject) => {
				const authFactory = new GoogleAuth();
				const jwtClient = new authFactory.JWT(
					email,
					null,
					key,
					['https://www.googleapis.com/auth/calendar']
				);
				jwtClient.authorize(error => error ? reject(error) : resolve(jwtClient));
		});
		}
		return pending;
	}
}