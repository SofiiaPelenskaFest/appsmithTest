export default {
	formCounter: 0,

	onPageLoad(){
		this.formCounter = get_language.data?.data?.language.length || 1;
	},

	async handleSubmit(){
		await TokenValidator.validateToken();

		const forms = [FormLanguage0.data, FormLanguage1.data, FormLanguage2.data, FormLanguage3.data, FormLanguage4.data, FormLanguage5.data].filter(f => f !== undefined);

		const correctForms = forms.map(form => {
			const Name = Object.keys(form).filter(k => k.startsWith('SelectLanguage'))[0];
			const Level = Object.keys(form).filter(k => k.startsWith('SelectLevel'))[0];

			return {
				Name: form[Name],
				Level: form[Level],
			}
		}).filter(f => f.Name)

		try {
			for (let i = 0; i < correctForms.length; i++) {
				if (get_language.data?.data?.language[i]) {
					// update
					const festCloudId = get_language.data?.data?.language[i].FestCloudID;

					const data = {
						Name: correctForms[i].Name,
						Level: correctForms[i].Level
					};

					await update_language.run({
						festCloudId,
						data
					})
					if (update_language?.data?.errors) {
						throw `Language: ${update_language?.data?.errors[0].message}`
					}

				} else if (!get_language.data?.data?.language[i] && correctForms[i]) {
					const data = {
						PersonFestCloudID: maininfo.employeeID,
						Name: correctForms[i].Name,
						Level: correctForms[i].Level
					};

					await insert_language.run({
						data
					});
					if (insert_language?.data?.errors) {
						throw `Language: ${insert_language?.data?.errors[0].message}`
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
		await resetWidget(`FormLanguage${num}`)

		if (get_language.data?.data?.language[num]) {
			const festCloudId = get_language.data?.data?.language[num].FestCloudID;

			try {
				await delete_language.run({
					festCloudId
				})
				if (delete_language?.data?.errors) {
					throw `Language: ${delete_language?.data?.errors[0].message}`
				}
			} catch (error) {
				showAlert(error, 'error')
			}
			this.restoreData();
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
			await get_language.run();
			if (get_language?.data?.errors) {
				throw `${get_language?.data?.errors[0].message}`
			}
		} catch (error) {
			showAlert(error, 'error')
		}
		this.onPageLoad();
	},
}