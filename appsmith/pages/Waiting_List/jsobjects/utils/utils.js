export default {
	isWithin24Hours: (auditCreatedAt) => {
		const createdAt = new Date(auditCreatedAt);
		const now = new Date();

		const diffInMs = now.getTime() - createdAt.getTime();
		const hours24InMs = 24 * 60 * 60 * 1000;

		return diffInMs <= hours24InMs;
	},
	
	async getAllPeoplePerson() {
		await get_all_people_person.run();
		
		if (get_all_people_person?.data?.errors) {
			OnPageLoad.showCow = true;
			showAlert(get_all_people_person?.data?.errors[0].message , 'error')
		}
	}
}
