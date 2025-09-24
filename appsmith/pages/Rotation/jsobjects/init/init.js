export default {
	loading: true,
	showCow: false,
	employeeFestCloudID: appsmith.URL.queryParams.employeeFestCloudId,
	selectedAssigmentId: appsmith.URL.queryParams.selectedAssigmentId,
	endDate: moment(),
	startDate: moment(),

	async init () {
		await i18n.setup(appsmith.store.localization || "uk")

		try {
			await get_roles_user.run();
			if (get_roles_user.data.length === 0) {
				this.showCow = true;
				throw 'Permissions error'
			}
			await GetPositionsResponsibleAdaptat.run();
			if (GetPositionsResponsibleAdaptat.data.length === 0) {
				throw 'Dictionary error'
			}
			await GetPositionsResponsibleDismiss.run();
			if (GetPositionsResponsibleDismiss.data.length === 0) {
				throw 'Dictionary error'
			}
			await get_dismissal_managers.run();
			if (get_dismissal_managers?.data?.errors) {
				throw get_dismissal_managers?.data?.errors[0].message
			}
			await utils.getDismissalResponsibleData();
			await get_managers.run();
			if (get_managers?.data?.errors) {
				throw get_managers?.data?.errors[0].message
			}
			await get_workgroups.run();
			if (get_workgroups?.data?.errors) {
				throw get_workgroups?.data?.errors[0].message
			}
			await utils.getDeepestWorkgroups();
			await get_all__position.run();
			if (get_all__position?.data?.errors) {
				throw get_all__position?.data?.errors[0].message
			}
			await get_employee.run();
			if (get_employee?.data?.errors) {
				throw get_employee?.data?.errors[0].message
			}
			await get_all__dictionary.run();
			if (get_all__dictionary?.data?.errors) {
				throw get_all__dictionary?.data?.errors[0].message
			}
			await get_one_assignment.run({
				id: this.selectedAssigmentId,
			});
			if (get_one_assignment?.data?.errors) {
				throw get_one_assignment?.data?.errors[0].message
			}
			await get_roles.run();
			if (get_roles.data.length === 0) {
				throw 'Roles error'
			}
		} catch (error) {
			showAlert(error,'error')
		} finally {
			this.loading = false;
		}
	}
}