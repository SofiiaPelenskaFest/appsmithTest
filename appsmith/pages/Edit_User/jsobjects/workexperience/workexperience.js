export default{
	formCounter: 0,

	onPageLoad(){
		this.formCounter =  get_workexperience.data?.data?.workexperience.length || 1;
	},

	async handleSubmit(){
		const forms = [Form1.data, Form2.data, Form3.data, Form4.data, Form5.data, Form6.data, Form7.data].filter(f => f !== undefined);

		const correctForms = forms.map(form => {

			const CompanyName = Object.keys(form).filter(k => k.startsWith('CompanyName'))[0];
			const PositionName = Object.keys(form).filter(k => k.startsWith('PositionName'))[0];
			const StartDate = Object.keys(form).filter(k => k.startsWith('WorkStartDate'))[0];
			const EndDate = Object.keys(form).filter(k => k.startsWith('WorkEndDate'))[0];

			return {
				CompanyName: form[CompanyName],
				PositionName: form[PositionName],
				StartDate: form[StartDate],
				EndDate: form[EndDate]
			}
		}).filter(f => f.CompanyName);

		try {
			for (let i = 0; i < correctForms.length; i++) {
				if (get_workexperience.data?.data?.workexperience[i]) {
					//update
					const data = {
						CompanyName: utils.capitalizeFirstLowerRest(correctForms[i].CompanyName),
						PositionName: utils.capitalizeFirstLowerRest(correctForms[i].PositionName),
						EndDate: utils.formatDate(correctForms[i].EndDate),
						StartDate: utils.formatDate(correctForms[i].StartDate)
					};

					const festCloudId = get_workexperience.data?.data?.workexperience[i].FestCloudID

					await update_workexpierence.run({
						festCloudId,
						data,
					})
					if (update_workexpierence?.data?.errors) {
						throw `Experience: ${update_workexpierence?.data?.errors[0].message}`
					}

				} else if (!get_workexperience.data?.data?.workexperience[i] && correctForms[i].CompanyName) {
					const data = {
						PersonFestCloudID: maininfo.employeeID,
						CompanyName: utils.capitalizeFirstLowerRest(correctForms[i].CompanyName),
						PositionName: utils.capitalizeFirstLowerRest(correctForms[i].PositionName),
						EndDate: utils.formatDate(correctForms[i].EndDate),
						StartDate: utils.formatDate(correctForms[i].StartDate)
					};

					await insert_workexpierence.run({
						data
					});
					if (insert_workexpierence?.data?.errors) {
						throw `Experience: ${insert_workexpierence?.data?.errors[0].message}`
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
		await resetWidget(`Form${num + 1}`)
		if (get_workexperience.data.data.workexperience[num]) {
			const festCloudId = get_workexperience.data?.data?.workexperience[num].FestCloudID;

			try {
				await delete_workexperience.run({
					festCloudId
				})
				if (delete_workexperience?.data?.errors) {
					throw `Experience: ${delete_workexperience?.data?.errors[0].message}`
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
			await get_workexperience.run();
			if (get_workexperience?.data?.errors) {
				throw `Experience: ${get_workexperience?.data?.errors[0].message}`
			}
		} catch (error) {
			showAlert(error, 'error')
		}
		this.onPageLoad();
	},
}