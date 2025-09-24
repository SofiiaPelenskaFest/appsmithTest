export default {
	loading: true,
	showCow: false,
	assigmentId: appsmith.URL.queryParams.selectedAssigmentId,

	async init () {
		await i18n.setup(appsmith.store.localization || "uk")
		await TokenValidator.validateToken();

		try {
			await get_roles_user.run();
			if (get_roles_user.data.length === 0) {
				this.showCow = true;
				throw 'Permissions error'
			}
			await get_all_assigments.run();
			if (get_all_assigments?.data?.errors) {
				this.showCow = true;
				throw get_all_assigments?.data?.errors[0].message
			}
			await get_all_actions.run();
			if (get_all_actions?.data?.errors) {
				throw get_all_actions?.data?.errors[0].message
			}
			await GetDismissalFilter.run();
			if (GetDismissalFilter.data.length === 0) {
				throw 'Dictionary error'
			}
			await utils.createDismissalList();
			await utils.readOnlyFunc();
		}
		catch (error) {
			showAlert(error,'error')
		} finally {
			this.loading = false;
		}
	}
}