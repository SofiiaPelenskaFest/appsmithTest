export default {
	hoveredItemFestCloudID: null,
	showCow: null,

	runQuerries: async () => {
		await i18n.setup(appsmith.store.localization || "uk")
		await TokenValidator.validateToken();
		try {
			await get_roles_user.run();
			if (get_roles_user.data.length === 0) {
				throw 'Permissions error'
			} 
			utils.getAllPeoplePerson();
			
		} catch (error) {
			this.showCow = true;
			showAlert(error,'error')
		}
	},
}
