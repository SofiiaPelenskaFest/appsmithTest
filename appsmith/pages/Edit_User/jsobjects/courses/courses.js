export default {
	formCounter: 0,

	onPageLoad(){
		this.formCounter = get_additionaleducation.data?.data?.additionaleducation?.length || 1;
	},

	async handleSubmit(){
		await TokenValidator.validateToken();

		const forms = [FormCourse0.data, FormCourse1.data, FormCourse2.data, FormCourse3.data, FormCourse4.data, FormCourse5.data, FormCourse6.data, FormCourse7.data, FormCourse8.data, FormCourse9.data, FormCourse10.data, FormCourse11.data ].filter(f => f !== undefined);

		const correctForms = forms.map(form => {
			const CourseName = Object.keys(form).filter(k => k.startsWith('CourseName'))[0];
			const ObtainingDate = Object.keys(form).filter(k => k.startsWith('CourseObtaining'))[0];

			return {
				CourseName: form[CourseName],
				ObtainingDate: form[ObtainingDate],
			}
		}).filter(f => f.CourseName);

		try {
			for (let i = 0; i < correctForms.length; i++) {
				if (get_additionaleducation.data?.data?.additionaleducation[i]) {
					// update
					const festCloudId = get_additionaleducation.data?.data?.additionaleducation[i].FestCloudID;

					const data = {
						CourseName: utils.capitalizeFirstLowerRest(correctForms[i].CourseName),
						ObtainingDate: utils.formatDate(correctForms[i].ObtainingDate)
					};

					await update_additionaleducation.run({
						festCloudId,
						data,
					})
					if (update_additionaleducation?.data?.errors) {
						throw `Education: ${update_additionaleducation?.data?.errors[0].message}`
					}
				} else if (!get_additionaleducation.data?.data?.additionaleducation[i] && correctForms[i]){
					const data = {
						PersonFestCloudID: maininfo.employeeID,
						CourseName: utils.capitalizeFirstLowerRest(correctForms[i].CourseName),
						ObtainingDate: utils.formatDate(correctForms[i].ObtainingDate)
					};

					await insert_additionaleducation.run({
						data
					})
					if (insert_additionaleducation?.data?.errors) {
						throw `Education: ${insert_additionaleducation?.data?.errors[0].message}`
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
		await resetWidget(`FormCourse${num}`)

		try {
			if (get_additionaleducation.data?.data?.additionaleducation[num]) {
				const festCloudId = get_additionaleducation.data?.data?.additionaleducation[num].FestCloudID;

				await delete_additionaleducation.run({
					festCloudId
				})
				if (delete_additionaleducation?.data?.errors) {
					throw `Education: ${delete_additionaleducation?.data?.errors[0].message}`
				}
				this.restoreData();
			}
		} catch (error) {
			showAlert(error, 'error')
		}
	},

	async addForm(){
		if (this.formCounter === 12) {
			return;
		}

		this.formCounter++;
	},

	async restoreData(){
		try {
			await get_additionaleducation.run();
			if (get_additionaleducation?.data?.errors) {
				throw `${get_additionaleducation?.data?.errors[0].message}`
			}
			this.onPageLoad();
		} catch (error) {
			showAlert(error, 'error')
		}
	},
}