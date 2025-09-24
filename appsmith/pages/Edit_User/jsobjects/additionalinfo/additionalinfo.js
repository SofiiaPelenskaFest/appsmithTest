export default {
	beforeData: null,

	onPageLoad(){
		this.beforeData = get_additionalinfo?.data?.data?.additionalinfo?.length > 0 ? true : false;
		console.log(get_additionalinfo.data)
		console.log(this.beforeData)
	},

	async handleSubmit(){
		console.log(this.beforeData)
		await TokenValidator.validateToken();
		try {
		if (this.beforeData) {
			console.log('update')
			await update_additionalinfo.run({
				personId: maininfo.employeeID,
				data: {
					DrivingLicense: DrivingLicence.selectedOptionValue,
					CommunityBelonging: utils.capitalizeFirstLowerRest(CommunityBelonging.text),
					Interests: utils.capitalizeFirstLowerRest(Interests.text)
				}
			})
			if (update_additionalinfo?.data?.errors) {
				throw `Additional: ${update_additionalinfo?.data?.errors[0].message}`
			}
		} else {
			await insert_addionalinfo.run({
				data: {
					PersonFestCloudID: maininfo.employeeID,
					DrivingLicense: DrivingLicence.selectedOptionValue,
					CommunityBelonging: utils.capitalizeFirstLowerRest(CommunityBelonging.text),
					Interests: utils.capitalizeFirstLowerRest(Interests.text)
				}
			});
			if (insert_addionalinfo?.data?.errors) {
				throw `Additional: ${insert_addionalinfo?.data?.errors[0].message}`
			}

			this.beforeData.additionalInfo = true;
		}

		switcher.showAlert();
		} catch (error) {
			showAlert(error,'error')
		}
	},
}