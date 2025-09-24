export default {
	listKey: null,
	pageName: '',
	isLoading: false,

	async changeList(item){	
		await TokenValidator.validateToken();

		const id = item?.id ?? "main_info";
		const name = item?.name ?? i18n.translate("editUserFormTitle");

		if (id === this.listKey) {
			return;
		}
		this.isLoading = true;

		this.pageName = name;
		this.listKey = id;

		try {
			switch(this.listKey){
				case "main_info":
					await get_maininfo.run();
					// if (get_maininfo?.data?.errors) {
						// throw get_maininfo?.data?.errors[0].message
					// }
					maininfo.onPageLoad();
					break;
				case "identity_data":
					// >>>> If we need to work with documents - uncomment
					// await get_taxonomy.run();
					await get_identification.run();
					if (get_identification?.data?.errors) {
						throw get_identification?.data?.errors[0].message
					}
					await get_identification_address.run();
					if (get_identification_address?.data?.errors) {
						throw get_identification_address?.data?.errors[0].message
					}
					await get_identification_dms.run();
					if (get_identification_dms?.data?.errors) {
						throw get_identification_dms?.data?.errors[0].message
					}
					identification.onPageLoad();
					break;
				case "experience":
					await get_workexperience.run();
					if (get_workexperience?.data?.errors) {
						throw get_workexperience?.data?.errors[0].message
					}
					workexperience.onPageLoad();
					break;
				case "education":
					await get_education.run();
					if (get_education?.data?.errors) {
						throw get_education?.data?.errors[0].message
					}
					education.onPageLoad();
					break;
				case "courses":
					await get_additionaleducation.run();
					if (get_additionaleducation?.data?.errors) {
						throw get_additionaleducation?.data?.errors[0].message
					}
					courses.onPageLoad();
					break;
				case "languages":
					await get_language.run();
					if (get_language?.data?.errors) {
						throw get_language?.data?.errors[0].message
					}
					language.onPageLoad();
					break;
				case "additional_info":
					await get_additionalinfo.run();
					if (get_additionalinfo?.data?.errors) {
						throw get_additionalinfo?.data?.errors[0].message
					}
					additionalinfo.onPageLoad();
					break;
				case "family":
					await get_family_child.run();
					if (get_family_child?.data?.errors) {
						throw get_family_child?.data?.errors[0].message
					}
					await get_family_identification.run();
					if (get_family_identification?.data?.errors) {
						throw get_family_identification?.data?.errors[0].message
					}
					family.onPageLoad();				
					break;
			}
		} catch (error) {
			showAlert(error,'error')
		}
		finally {
			this.isLoading = false;
		}
	},

	showAlert(){
		showAlert(`${i18n.translate("pageEditedAlert1")} ${this.pageName} ${i18n.translate("pageEditedAlert2")}`, 'success')
	},
}
