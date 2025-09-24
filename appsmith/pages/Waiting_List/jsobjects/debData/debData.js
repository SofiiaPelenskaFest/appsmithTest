export default {
	timeoutId: null,
	prevCheck: null,

	async loadData() {
		TokenValidator.validateToken();
		utils.getAllPeoplePerson();
	},

	debouncedFetch() {
		if (this.timeoutId) {
			clearTimeout(this.timeoutId);
		}

		this.timeoutId = setTimeout(() => {
			this.loadData();
		}, 500);
	}
}
