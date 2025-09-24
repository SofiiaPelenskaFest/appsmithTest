export default {
	formCounter: 0,

	onPageLoad(){
		this.formCounter = get_education.data?.data?.education?.length || 1;
	},

	async handleSubmit(){
		await TokenValidator.validateToken();

		const forms = [FormEducation0.data, FormEducation1.data, FormEducation2.data, FormEducation3.data, FormEducation4.data, FormEducation5.data].filter(f => f !== undefined);

		const correctForms = forms.map(form => {
			const EducationalInstitution = Object.keys(form).filter(k => k.startsWith('EducationalInstitution'))[0];
			const SpecialtyName = Object.keys(form).filter(k => k.startsWith('SpecialtyName'))[0];
			const EducationLevel  = Object.keys(form).filter(k => k.startsWith('EducationLevel'))[0];

			return {
				EducationLevel: form[EducationLevel],
				EducationalInstitution: form[EducationalInstitution],
				SpecialtyName: form[SpecialtyName],
			}
		}).filter(f => f.EducationalInstitution); // Like required

		try {
			for (let i = 0; i < correctForms.length; i++) {
				if (get_education.data?.data?.education[i]) {
					const festCloudId = get_education.data?.data?.education[i].FestCloudID;

					const data = {
						EducationLevel: correctForms[i].EducationLevel,
						EducationalInstitution: correctForms[i].EducationalInstitution,
						SpecialtyName: correctForms[i].SpecialtyName
					}

					await update_education.run({
						festCloudId,
						data
					})
					if (update_education?.data?.errors) {
						throw `Education: ${update_education?.data?.errors[0].message}`
					}
				} else if (!get_education.data?.data?.education[i] && correctForms[i]) {
					const data = {
						PersonFestCloudID: maininfo.employeeID,
						EducationLevel: correctForms[i].EducationLevel,
						EducationalInstitution: correctForms[i].EducationalInstitution,
						SpecialtyName: correctForms[i].SpecialtyName
					};

					await insert_education.run({
						data
					});
					if (insert_education?.data?.errors) {
						throw `Education: ${insert_education?.data?.errors[0].message}`
					}
				}
			}
			this.restoreData();
			switcher.showAlert();
		} catch (error) {
			showAlert(error, 'error')
		}
	},

	async removeForm(num){
		this.formCounter--;
		await resetWidget(`FormEducation${num + 1}`)
		if (get_education.data?.data?.education[num]) {
			const festCloudId = get_education.data?.data?.education[num].FestCloudID;

			try {
				await delete_education.run({
					festCloudId
				})
				if (delete_education?.data?.errors) {
					throw `Education: ${delete_education?.data?.errors[0].message}`
				}
				this.restoreData();
			} catch (error) {
				showAlert(error, 'error')
			}
		}
	},

	async addForm(){
		if (this.formCounter === 6) {
			return;
		}

		this.formCounter++;
	},

	async restoreData(){
		try {
			await get_education.run();
			if (get_education?.data?.errors) {
				throw `${get_education?.data?.errors[0].message}`
			}
		} catch (error) {
			showAlert(error, 'error')
		}
		this.onPageLoad();
	},
}