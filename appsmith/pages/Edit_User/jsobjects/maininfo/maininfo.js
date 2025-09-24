export default {
	beforeData: null,
	isPhoneValid: false,
	isMyPage: appsmith.URL.queryParams.isMyPage,
	storage: 'internal',
	isContact: false,
	isValid: true,
	employeeID: appsmith.URL.queryParams.employeeFestCloudId,

	async onPageLoad(){
		await i18n.setup(appsmith.store.localization || "uk")
		try {
			await get_maininfo.run();
			if (get_maininfo?.data?.errors) {
				throw get_maininfo?.data?.errors[0].message
			}
			this.isContact = get_maininfo.data?.data?.person[0]?.contact?.length > 0;

			this.beforeData = {
				familyName: get_maininfo.data?.data?.person[0]?.FamilyName,
				name: get_maininfo.data?.data?.person[0]?.Name,
				middleName: get_maininfo.data?.data?.person[0]?.MiddleName,
				phoneNumber: get_maininfo.data?.data?.person[0]?.contact?.WorkPhone[0]?.PhoneNumber || '',
				email: get_maininfo.data?.data?.person[0]?.contact?.PersonalEmail[0]?.Email || '',
				gender: get_maininfo.data?.data?.person[0]?.Gender,
				birthday: get_maininfo.data?.data?.person[0]?.Birthday
			}

			if (this.beforeData.phoneNumber) {
				this.handlePhoneChange();
			}
		} catch (error) {
			showAlert(error,'error')
		}
	},

	async handleSubmit(){
		await TokenValidator.validateToken();
		const existingPhone = get_maininfo.data?.data?.person[0]?.contact?.WorkPhone[0]?.PhoneNumber;
		const existingEmail = get_maininfo.data?.data?.person[0]?.contact?.PersonalEmail[0]?.Email;

		const isWorkPhone = Boolean(existingPhone);
		const isPersonalEmail =  Boolean(existingEmail);

		const candidatesToAdd = [];

		if (!isPersonalEmail) {
			candidatesToAdd.push({
				PrincipalFestCloudID: maininfo.employeeID,
				ContactType: "Personal",
				ContactSource: "Email",
				ContactValue: emailInput.text,
			})
		}

		if (!isWorkPhone) {
			candidatesToAdd.push({
				PrincipalFestCloudID: maininfo.employeeID,
				ContactType: "Work",
				ContactSource: "Телефон",
				ContactValue: utils.clearPhone(phoneInput.text),
			});
		}

		if (candidatesToAdd.length > 0) {
			await insert_contacts.run({
				dataContact: candidatesToAdd
			});
			if (insert_contacts?.data?.errors) {
				throw `Contacts: ${insert_contacts?.data?.errors[0].message}`
			}
		}

		if (candidatesToAdd.length !== 2) {
			if (existingPhone !== utils.clearPhone(phoneInput.text)) {
				await update_contacts.run({
					id: maininfo.employeeID,
					type:"Work",
					source: "Телефон",
					dataContact: {
						ContactValue:  utils.clearPhone(phoneInput.text)
					}
				});
				if (update_contacts?.data?.errors) {
					throw `Phone: ${insert_contacts?.data?.errors[0].message}`
				}
			}
			if (isPersonalEmail !== emailInput.text) {
				await update_contacts.run({
					id: maininfo.employeeID,
					type:"Personal",
					source: "Email",
					dataContact: {
						ContactValue: emailInput.text
					}
				});
				if (update_contacts?.data?.errors) {
					throw `Email: ${insert_contacts?.data?.errors[0].message}`
				}
			}
		}

		await update_person.run({
			personId: maininfo.employeeID,
			data: {
				Gender: genderSelect.selectedOptionValue,
			}
		})
		if (update_person?.data?.errors) {
			throw `Gender: ${insert_contacts?.data?.errors[0].message}`
		}

		switcher.showAlert();
	},

	async handleNavigateBack(){
		const returnTo = 'Profile_Page';
		const id =  this.employeeID;

		await navigateTo(returnTo, {
			id, 
			isMyPage: this.isMyPage, 
			storage: this.storage,
			checked: appsmith.URL.queryParams.checked || '',
			expanded: appsmith.URL.queryParams.expanded ||  '',
		}, 'SAME_WINDOW');
		await resetWidget('ContainerInfo')
	},

	async handlePhoneChange(){
		const {formatted, valid} = utils.formatPhone(phoneInput.text || this.beforeData.phoneNumber)

		this.isPhoneValid = valid;
		await phoneInput.setValue(formatted);
	},
}