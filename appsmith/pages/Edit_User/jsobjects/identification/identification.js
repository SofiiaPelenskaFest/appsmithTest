export default {
	isResidence: false,
	isRegistration: false,
	isIdentification: false,
	isCheckboxFirstClick: false,
	beforeData: null,

	onPageLoad(){
		this.isIdentification = get_identification.data?.data?.identification?.length > 0;
		this.isResidence = get_identification_address.data?.data?.residence?.length > 0;
		this.isRegistration = get_identification_address.data?.data?.registration?.length > 0;
		this.isCheckboxFirstClick = false;

		this.beforeData = {
			residence: {
				Country: get_identification_address.data?.data?.residence[0]?.Country || '',
				City: get_identification_address.data?.data?.residence[0]?.City || '',
				Street: get_identification_address.data?.data?.residence[0]?.Street || '',
				BuildingNumber: get_identification_address.data?.data?.residence[0]?.BuildingNumber || '',
				Apartment: get_identification_address.data?.data?.residence[0]?.Apartment || '',
				PostalCode: get_identification_address.data?.data?.residence[0]?.PostalCode || ''
			}};

	},

	async handleSubmit(){
		await TokenValidator.validateToken();

		const candidatesToUpdate = [];
		const candidatesToAdd = [];

		const residence = {
			Country: utils.capitalizeFirstLowerRest(ResidenceCountry.text) || '',
			City: utils.capitalizeFirstLowerRest(ResidenceCity.text) || '',
			Street: utils.capitalizeFirstLowerRest(ResidenceStreet.text) || '',
			PostalCode: ResidencePostalCode.text || '',
			BuildingNumber: ResidenceBuildingNumber.text || '',
			Apartment: ResidenceApartment.text || ''
		}
		const registration = {
			Country: utils.capitalizeFirstLowerRest(RegistrationCountry.text) || '',
			City: utils.capitalizeFirstLowerRest(RegistrationCity.text) || '',
			Street: utils.capitalizeFirstLowerRest(RegistrationStreet.text) || '',
			PostalCode: RegistrationPostalCode.text || '',
			BuildingNumber: RegistrationBuildingNumber.text || '',
			Apartment: RegistrationApartment.text || ''
		}

		if (this.isResidence) {
			const FestCloudID = get_identification_address.data?.data?.residence[0].FestCloudID

			candidatesToUpdate.push(this.createCandidateUpdate({
				address: {...residence, FestCloudID}
			}))
		} else {
			candidatesToAdd.push(residence)
		}

		if (this.isRegistration) {
			const FestCloudID = get_identification_address.data?.data?.registration[0].FestCloudID

			candidatesToUpdate.push(this.createCandidateUpdate({
				address: {...registration, FestCloudID}
			}))
		} else {
			candidatesToAdd.push(registration)
		}

		try {
			if (candidatesToAdd.length > 0) {
				await insert_identification_address.run({
					dataAddress: candidatesToAdd
				})
				if (insert_identification_address?.data?.errors) {
					throw `Identification: ${insert_identification_address?.data?.errors[0].message}`
				}

				const isTwoAddressAdded = insert_identification_address.data?.data?.inserted_address?.returning?.length === 2
				if (isTwoAddressAdded) {
					this.isRegistration = true;
					this.isResidence = true;

				}
			}
			if (candidatesToUpdate.length > 0) {
				await update_identification_address.run({
					dataAddress: candidatesToUpdate
				})
				if (update_identification_address?.data?.errors) {
					throw `Identification: ${update_identification_address?.data?.errors[0].message}`
				}
			}

			const residenceId = insert_identification_address.data?.data?.inserted_address?.returning[0]?.FestCloudID;
			const registrationId = insert_identification_address.data?.data?.inserted_address?.returning[1]?.FestCloudID;

			if (this.isIdentification) {

				const dataIdentification = {
					MilitaryRegistration: documentSelect.selectedOptionLabel
				};

				if (residenceId !== undefined) {
					dataIdentification.ResidenceAddressFestCloudID = residenceId;
				}

				if (registrationId !== undefined) {
					dataIdentification.RegistrationAddressFestCloudID = registrationId;
				}

				await update_identification.run({
					personId: maininfo.employeeID,
					dataIdentification,
				});
				if (update_identification?.data?.errors) {
					throw `Identification: ${update_identification?.data?.errors[0].message}`
				}
			} else {
				await insert_identification.run({
					dataIdentification: {
						PersonFestCloudID: maininfo.employeeID,
						MilitaryRegistration:  documentSelect.selectedOptionLabel,
						ResidenceAddressFestCloudID: residenceId,
						RegistrationAddressFestCloudID: registrationId
					}
				})
				if (insert_identification?.data?.errors) {
					throw `Identification: ${insert_identification?.data?.errors[0].message}`
				}
			}
			switcher.showAlert();
		} catch (error) {
			showAlert(error, 'error')
		}

		// >>>>> If we need to update documents - uncomment <<<<<<

		// const {series, number, taxonomyFestCloudID,  isNewPassport } = utils.getPassportFields();
		// const passports = get_identification_dms.data?.data?.dms_passport
		// const isNewPassportExist = utils.getPassportByName(passports, utils.taxonomy.ID_Cards);
		// const isOldPassportExist = utils.getPassportByName(passports, utils.taxonomy.Paper_Passport);;
		// 
		// 
		// if ((isNewPassport && isNewPassportExist) || (!isNewPassport && isOldPassportExist)) {
		// const id = isNewPassport && isNewPassportExist ? isNewPassportExist.passport.FestCloudID : isOldPassportExist.passport.FestCloudID;
		// 
		// await update_dms_id.run({
		// id,
		// dataPassport: {
		// DocumentSeries: series,
		// DocumentNumber: number
		// }
		// })
		// } else {
		// await insert_dms_id.run({
		// dataId: {
		// DocumentSeries: series,
		// DocumentNumber: number,
		// PersonFestCloudID: maininfo.employeeID,
		// personaliddata_festcloudid_document: {
		// data: {
		// Name: "Паспорт громадянина України",
		// TaxonomyFestCloudID: taxonomyFestCloudID,
		// }
		// }
		// }
		// })
		// } 
		// 
		// const taxId = get_identification_dms.data?.data?.dms_tax[0]?.tax?.FestCloudID
		// 
		// if (taxId) {
		// await update_dms_tax.run({
		// id: taxId,
		// dataTax: {
		// IndividualTaxpayerNumber: taxpayerInput.text
		// }
		// })
		// } else {
		// await insert_dms_tax.run({
		// dataTax: {
		// IndividualTaxpayerNumber: taxpayerInput.text,
		// PersonFestCloudID: maininfo.employeeID,
		// personaltaxdata_festcloudid_document: {
		// data: {
		// Name: "Індивідуальний податковий номер",
		// TaxonomyFestCloudID: utils.getTaxonomyByName(utils.taxonomy.Individual_Tax_Number).FestCloudID
		// }
		// }
		// }
		// });
		// }


		// >>>>> If we need to update loyaltycard - uncomment <<<<<<
		// await update_customer.run({
		// personId: maininfo.employeeID,
		// data: {
		// LoyaltyCard: LocalCard.text || ''
		// }
		// });
	},

	async handleCheckChange() {
		if (!this.isCheckboxFirstClick) {
			for (const key in this.beforeData) {
				this.beforeData[key] = ''
			}

			this.isCheckboxFirstClick = true;
		}
	},

	createCandidateUpdate({ address }) {
		const { FestCloudID, ...addressFields } = address;

		return {
			"where": {
				"FestCloudID": {"_eq": `${FestCloudID}`}
			}, 
			"_set": addressFields
		}
	}
}