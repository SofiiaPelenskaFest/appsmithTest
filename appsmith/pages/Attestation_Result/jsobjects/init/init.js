export default {
	loading: true,
	showCow: false,
	assigmentId: appsmith.URL.queryParams.selectedAssigmentId,

	async init () {
		await i18n.setup(appsmith.store.localization || "uk")
		try {
			await TokenValidator.validateToken();
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
			await get_all_questions.run();
			if (get_all_questions?.data?.errors) {
				throw get_all_questions?.data?.errors[0].message
			}
			await GetQuestionsFilter.run();
			if (GetQuestionsFilter.data.length === 0) {
				throw 'Dictionary error'
			}
			await utils.createAttestationList();
			await utils.resultCounter();
			await utils.readOnlyFunc();
		} 
		catch (error) {
			showAlert(error,'error')
		}
		finally {
			this.loading = false;
		}
	}
}