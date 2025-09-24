export default {
	isPhoneValid: false,
	isMyPage: appsmith.URL.queryParams.isMyPage,
	storage: 'internal',
	loading: true,

	dismissalEmployee: null,
	assignmentEmployee: null,
	affiliationEmployee: null,
	employeeFestCloudId: appsmith.URL.queryParams.employeeFestCloudId,
	existingID: '',
	phoneNumber: '',

	title: '',
	description: '',
	buttonLeft: '',
	buttonRight: '',
	willBeNewPerson: false,

	Profile_PageLink: "/uk/workspaces/7b221e7d-1189-4546-ad91-ea615fb75afd/cc0eb808-bfff-444b-ad3f-9f073e4e069b",
	link: appsmith.env.META4_URL,


	async onPageLoad(){
		await i18n.setup(appsmith.store.localization || "uk");
		this.loading = true;

		if (this.employeeFestCloudId) {
			await get_person_by_id.run();
			await get_dms_by_id.run();
			//this.phoneNumber = get_person_by_id.data?.data?.person[0]?.principal?.contact[0]?.PhoneNumber
			this.phoneNumber = get_person_by_id.data?.data?.person[0]?.principal?.contact?.find(c => c.ContactType === "Work" && c.ContactSource === "Телефон")?.ContactValue || ""
			this.handlePhoneChange();
		} else {
			await resetWidget('main');
			await resetWidget('identification');
		}
		await get_taxonomy.run();
		this.loading = false;
	},

	async handleSubmit(){
		await TokenValidator.validateToken();

		await get_email.run();
		const email = get_email.data?.data?.email[0]?.Email

		if (init.employeeFestCloudId) {
			const beforeEmail = get_person_by_id.data?.data?.person[0]?.principal?.contact[0]?.Email
			if (email && email !== beforeEmail) {
				showAlert(i18n.translate("dublicatedByEmailPersonAlert"), 'error')
				return;
			} 
			this.handleUpdateExisting(true);
		} else {
			this.handleCheckExisting();
		}
	},

	async handleCreate(){
		this.loading = true;
		await TokenValidator.validateToken();

		this.willBeNewPerson = true;

		await insert_person.run({
			dataPerson: {
				FamilyName: familyNameInput.text.trim(),
				Name: nameInput.text.trim(),
				MiddleName: middleNameInput.text.trim(),
				Gender: genderSelect.selectedOptionValue,
				DayOfBirth: moment(datePicker.selectedDate).format('MM-DD'),
				Birthday: utils.formatDate(datePicker.selectedDate), 
			}
		});

		const PersonFestCloudID = insert_person.data?.data?.insert?.returning[0]?.FestCloudID;

		await insert_contacts.run({
			dataContact: [
				{
					PrincipalFestCloudID: PersonFestCloudID,
					ContactType: "Personal",
					ContactSource: "Email",
					ContactValue: emailInput.text.trim(),
				},
				{
					PrincipalFestCloudID: PersonFestCloudID,
					ContactType: "Work",
					ContactSource: "Телефон",
					ContactValue: utils.clearPhone(phoneInput.text),
				},
				{
					PrincipalFestCloudID: PersonFestCloudID,
					ContactType: "Work",
					ContactSource: "Email",
					ContactValue: emailInput.text.trim(),
				}
			]
		});

		let counter = 0;
		while(counter < 3) {
			await new Promise((res) => setTimeout(res, 5000))
			try{
				await get_dms_person_byId.run({id: PersonFestCloudID})	
			}catch(error){
			}

			if(get_dms_person_byId.data.data.get_dms_person.length > 0) {
				break
			}
			counter = counter + 1
		}

		if (counter === 3) {
			this.loading = false;
			showAlert(i18n.translate("dmsNotFindedAlert"), 'error')
			await this.handleNavigateBack();
			return;
		}

		await insert_dms_tax.run({
			dataTax: {
				IndividualTaxpayerNumber: taxpayerInput.text,
				PersonFestCloudID,
				personaltaxdata_festcloudid_document: {
					data: {
						Name: "Індивідуальний податковий номер",
						TaxonomyFestCloudID: utils.getTaxonomyByName(utils.taxonomy.Individual_Tax_Number).FestCloudID
					}
				}
			}
		});

		const {series, number, taxonomyFestCloudID } = utils.getPassportFields();

		await insert_dms_id.run({
			dataId: {
				DocumentSeries: series,
				DocumentNumber: number,
				PersonFestCloudID,
				personaliddata_festcloudid_document: {
					data: {
						Name: "Паспорт громадянина України",
						TaxonomyFestCloudID: taxonomyFestCloudID,
					}
				}
			}
		})
		this.loading = false;
		await this.handleNavigateBack();
	},

	async handleUpdateExisting(isIdFromUrl = false) {
		await TokenValidator.validateToken();
		this.loading = true;

		const PersonFestCloudID = isIdFromUrl ?  init.employeeFestCloudId : this.existingID;

		if (this.dismissalEmployee) {
			// update people_employee_stage => Returned
			await update_employee.run({
				id: this.existingID,
				dataEmployee: {
					Stage: 'Returned',
				}
			})
		}

		const contacts = isIdFromUrl ? get_person_by_id.data?.data?.person[0]?.principal?.contact : (get_person_by_fields.data?.data?.person[0]?.principal?.contact || get_dms_by_dms?.data?.data?.taxNumber[0]?.person?.principal?.contact)

		const isWorkEmail = utils.getContact(contacts, 'Work', "Email");
		const isPersonalEmail = utils.getContact(contacts, 'Personal', "Email");
		const isWorkPhone = utils.getContact(contacts, 'Work', "Телефон");
		const isPersonalPhone = utils.getContact(contacts, 'Personal', "Телефон");

		const candidatesToAdd = [];

		if (!isPersonalPhone) {
			candidatesToAdd.push({
				PrincipalFestCloudID: PersonFestCloudID,
				ContactType: "Personal",
				ContactSource: "Телефон",
				ContactValue: utils.clearPhone(phoneInput.text),
			});
		}
		if (!isPersonalEmail) {
			candidatesToAdd.push({
				PrincipalFestCloudID: PersonFestCloudID,
				ContactType: "Personal",
				ContactSource: "Email",
				ContactValue: emailInput.text.trim(),
			})
		}
		if (!isWorkPhone) {
			candidatesToAdd.push({
				PrincipalFestCloudID: PersonFestCloudID,
				ContactType: "Work",
				ContactSource: "Телефон",
				ContactValue: utils.clearPhone(phoneInput.text),
			});
		}
		if (!isWorkEmail) {
			candidatesToAdd.push({
				PrincipalFestCloudID: PersonFestCloudID,
				ContactType: "Work",
				ContactSource: "Email",
				ContactValue: emailInput.text.trim(),
			})
		}

		if (candidatesToAdd.length > 0) {
			await insert_contacts.run({
				dataContact: candidatesToAdd
			});
		}

		if (candidatesToAdd.length !== 4) {
			await update_contacts.run({
				id: PersonFestCloudID,
				type:"Work",
				source: "Телефон",
				dataContact: {
					ContactValue:  utils.clearPhone(phoneInput.text)
				}
			});
			await update_contacts.run({
				id: PersonFestCloudID,
				type:"Personal",
				source: "Телефон",
				dataContact: {
					ContactValue:  utils.clearPhone(phoneInput.text)
				}
			});
			await update_contacts.run({
				id: PersonFestCloudID,
				type:"Work",
				source: "Email",
				dataContact: {
					ContactValue:  emailInput.text.trim()
				}
			});
			await update_contacts.run({
				id: PersonFestCloudID,
				type:"Personal",
				source: "Email",
				dataContact: {
					ContactValue: emailInput.text.trim()
				}
			});
		}

		await update_person.run({
			id: PersonFestCloudID,
			dataPerson: {
				FamilyName: familyNameInput.text.trim(),
				Name: nameInput.text.trim(),
				MiddleName: middleNameInput.text.trim(),
				Gender: genderSelect.selectedOptionValue,
				DayOfBirth: moment(datePicker.selectedDate).format('MM-DD'),
				Birthday: utils.formatDate(datePicker.selectedDate), 
			}
		});

		const {series, number, taxonomyFestCloudID,  isNewPassport } = utils.getPassportFields();
		const passports = isIdFromUrl ? get_dms_by_id.data?.data?.dms_passport : get_dms_by_fields.data?.data?.dms_passport
		const isNewPassportExist = utils.getPassportByName(passports, utils.taxonomy.ID_Cards);
		const isOldPassportExist = utils.getPassportByName(passports, utils.taxonomy.Paper_Passport);


		if ((isNewPassport && isNewPassportExist) || (!isNewPassport && isOldPassportExist)) {
			const id = isNewPassport && isNewPassportExist ? isNewPassportExist.passport.FestCloudID : isOldPassportExist.passport.FestCloudID;

			await update_dms_id.run({
				id,
				dataPassport: {
					DocumentSeries: series,
					DocumentNumber: number
				}
			})
		} else{
			await insert_dms_id.run({
				dataId: {
					DocumentSeries: series,
					DocumentNumber: number,
					PersonFestCloudID: PersonFestCloudID,
					personaliddata_festcloudid_document: {
						data: {
							Name: "Паспорт громадянина України",
							TaxonomyFestCloudID: taxonomyFestCloudID,
						}
					}
				}
			})
		} 

		const taxId = isIdFromUrl ? get_dms_by_id.data?.data?.dms_tax[0]?.tax?.FestCloudID : get_dms_by_fields.data?.data?.dms_tax[0]?.tax?.FestCloudID

		if (taxId) {
			await update_dms_tax.run({
				id: taxId,
				dataTax: {
					IndividualTaxpayerNumber: taxpayerInput.text
				}
			})
		} else {
			await insert_dms_tax.run({
				dataTax: {
					IndividualTaxpayerNumber: taxpayerInput.text,
					PersonFestCloudID,
					personaltaxdata_festcloudid_document: {
						data: {
							Name: "Індивідуальний податковий номер",
							TaxonomyFestCloudID: utils.getTaxonomyByName(utils.taxonomy.Individual_Tax_Number).FestCloudID
						}
					}
				}
			});
		}

		this.loading = false;
		this.handleNavigateBack();
	},

	async handleCheckExisting(){
		await get_person_by_fields.run();
		await get_dms_by_dms.run();
		await get_dms_by_fields.run();
		await get_affiliation_by_fields.run();

		const isEmployeeExist = get_person_by_fields.data?.data?.person?.length > 0 || get_dms_by_dms?.data?.data?.taxNumber?.length > 0;

		if (isEmployeeExist) {
			this.existingID = get_person_by_fields.data?.data?.person[0]?.FestCloudID || get_dms_by_dms?.data?.data?.taxNumber[0]?.PersonFestCloudID;

			// First, check the black/gray lists
			const lists = ['blacklist', 'graylist']
			for (const list of lists) {
				const affiliation = get_affiliation_by_fields.data?.data?.affiliations?.find(affiliation => affiliation.Type === list)

				if (affiliation){
					this.affiliationEmployee = {
						...affiliation,
						Label: list === 'blacklist' ? i18n.translate("blacklistLabel") : i18n.translate("graylistLabel")
					}
					break;
				}
			}
			// If not found — check if the employee has an active assignment
			if (!this.affiliationEmployee) {
				const assignment = get_person_by_fields.data?.data?.person[0]?.employee?.assignment?.find(assignment => assignment?.EndDate === null);

				if (assignment) {
					this.assignmentEmployee = assignment;
				} else {
					this.dismissalEmployee = get_person_by_fields.data?.data?.person[0]?.employee?.assignment[0];
				}

			}
			this.getCorrectText();
			await showModal(duplicateUserModal.name);

		} else {
			await this.handleCreate();
		}
	},

	async handleNavigateBack(){
		const returnTo = this.existingID && !this.dismissalEmployee ? 'Profile_Page' : 'Waiting_List' ;
		const id = this.existingID || this.employeeFestCloudId;

		if (this.willBeNewPerson) {
			showAlert(i18n.translate("newEployeeCreatedAlert"), 'success')
		} else {
			showAlert(i18n.translate("eployeesDataUpdatedAlert"), 'success')
		}

		if (returnTo === 'Profile_Page') {
			postWindowMessage({ 
				data: { 
					path: `${this.Profile_PageLink}?employeeFestCloudId=${id}&checked=${[...appsmith.URL.queryParams.checked].join('%2C')}&expanded=${[...appsmith.URL.queryParams.expanded].join('%2C')}&isMyPage=false` 
				}, 
				type: "NAVIGATE" 
			}, 'window', `${this.link}`);
		} else {
			await navigateTo(returnTo, {
				employeeFestCloudId: id, 
				isMyPage: this.isMyPage, 
				storage: this.storage,
				checked: appsmith.URL.queryParams.checked || '',
				expanded: appsmith.URL.queryParams.expanded ||  '',
			}, 'SAME_WINDOW');
		}
	},

	async handlePhoneChange(){
		const {formatted, valid} = utils.formatPhone(phoneInput.text || this.phoneNumber)

		init.isPhoneValid = valid;
		await phoneInput.setValue(formatted);
	},

	getPhoto(){
		const link = get_person_by_fields.data?.data?.person[0]?.employee?.PhotoLink || get_dms_by_dms?.data?.data?.taxNumber[0]?.person?.employee?.PhotoLink;

		return utils.formatGoogleDriveUrl(link)
	},

	getCorrectText(){
		if (init.affiliationEmployee?.Label?.startsWith('Чорний')){
			this.title = i18n.translate("modalWarningTitle");
			this.description = i18n.translate("modalWarningBlacklistDescription");
			this.buttonLeft = i18n.translate("modalAnotherPersonButton");
			this.buttonRight = i18n.translate("modalAnderstandButton");
		} else {

			if (init.affiliationEmployee?.Label?.startsWith('Сірий')) {
				this.title = i18n.translate("modalRenewAssignmentTitle");
			} else {
				this.title = i18n.translate("modalDublicateProfileTitle");
			}

			this.description = i18n.translate("modalDublicateProfileWarningDescription");

			if (init.affiliationEmployee?.Label?.startsWith('Сірий')) {
				this.description =  i18n.translate("modalGraylistWarningDescription") + " " + this.description;
			}

			this.buttonLeft =  i18n.translate("modalCreateNewButton");
			this.buttonRight = this.dismissalEmployee ? i18n.translate("modalSubmitRenewalButton") : i18n.translate("modalSubmitGotoButton");
		}
	},

	resetModalField(){
		this.dismissalEmployee =  null;
		this.assignmentEmployee =  null;
		this.affiliationEmployee = null;
		this.existingID = null;
		closeModal(duplicateUserModal.name)
	},
}
