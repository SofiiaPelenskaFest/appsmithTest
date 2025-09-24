export default {
	isLoading: true,
	origin: appsmith.env.META4_URL,
	refreshPromise: null,

	//Force logout and notify platform
	logout(errorMsg = '[AuthError] Your session has expired. Please log in again.') {
		console.error(errorMsg);

		postWindowMessage(
			{
				data: { error: 'Your session has expired. Please log in again.' },
				type: 'LOGOUT',
			},
			'window',
			this.origin
		);
	},

	// Check if JWT token is expired (or close to expiration)
	isTokenExpired(token) {
		try {
			const decoded = jwt_decode(token);
			const now = Date.now().valueOf() / 1000;

			if (!decoded.exp) return true;
			
			return now > decoded.exp;
		} catch (error) {
			this.logout(error?.message);
			return true;
		}
	},

	// Called when new tokens arrive (resolves waiting requests)
	async setNewTokens({ accessToken, refreshToken }) {
		// Resolve any pending refresh promise
		if (this.refreshPromise) {
			this.refreshPromise.resolve();
			this.refreshPromise = null;
		}

		// Persist tokens
		if (accessToken && refreshToken) {
			await storeValue('accessToken', accessToken);
			await storeValue('refreshToken', refreshToken);
		}
	},

	// Validate token, trigger refresh if expired, and wait for new tokens
	async validateToken() {
		const accessToken = appsmith.store.accessToken;
		const refreshToken = appsmith.store.refreshToken;

		if (!accessToken || !refreshToken) {
			this.logout('[AuthError] Access token or refresh token is missing');
			return;
		}

		// If already refreshing, or token expired → wait
		if (this.refreshPromise || this.isTokenExpired(accessToken)) {
			if (!this.refreshPromise) {
				// Create deferred promise
				let resolve, reject;
				const promise = new Promise((res, rej) => {
					resolve = res;
					reject = rej;
				});

				this.refreshPromise = { promise, resolve, reject };

				// Notify platform to refresh tokens
				postWindowMessage(
					{ type: 'TOKENS_EXPIRED' },
					'window',
					this.origin
				);
			}

			// Wait until setNewTokens() resolves it
			await this.refreshPromise.promise;
		}
	},
};
