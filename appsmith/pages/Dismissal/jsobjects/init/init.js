export default {
	loading: true,
	showCow: false,
	endDate: moment(),
	responsiblePeople: [],
	allReasons: [],

	async onPageLoad(){
		closeModal(submitDeletion.name)
		resetWidget('desktop')
		await this.fetchData();
	},

	async fetchData() {
		await TokenValidator.validateToken();
		await i18n.setup(appsmith.store.localization || "uk");

		try {
			await get_roles_user.run();
			if (get_roles_user.data.length === 0) {
				this.showCow = true;
				throw 'Permissions error'
			}
			await get_assignment_workgroup.run();
			if (get_assignment_workgroup?.data?.errors) {
				this.showCow = true;
				throw get_assignment_workgroup?.data?.errors[0].message
			}
			await GetPositionsResponsibleAdaptat.run();
			if (GetPositionsResponsibleAdaptat.data.length === 0) {
				throw 'Permissions error'
			}
			await get_all_managers.run();
			if (get_all_managers?.data?.errors) {
				throw get_all_managers?.data?.errors[0].message
			}
			await this.getResponsibleData();
			await get_all_reasons.run();
			if (get_all_reasons?.data?.errors) {
				throw get_all_reasons?.data?.errors[0].message
			}
			await this.getReasons();
		} catch (error) {
			showAlert(error,'error')
		} finally {
			this.loading = false;
		}
	},

	async getResponsibleData() {
		const { data } =  await get_all_managers.data;
		console.log(data)

		// We have to select only uniq fiels and sort them
		this.responsiblePeople = _.uniqBy(data?.peopleAssignment
																			.map(person => ({
			label: `${person.assignmentEmployee.employeeInfo.FamilyName} ${person.assignmentEmployee.employeeInfo.Name}`,
			value: person.EmployeeFestCloudID
		})), 'value') // Value must be uniq
			.sort((personOne, personTwo) => personOne.label.localeCompare(personTwo.label))
	},

	async getReasons(){
		const { data } = await get_all_reasons.data;
		this.allReasons = data.dismissalReason
			.map(reason => ({ label: reason.ItemName, value: reason.ItemValue }))
			.sort((a, b) => a.label.localeCompare(b.label))
			.concat({label: "Інша причина", value: "otherReason"})
	},

	async handleNavigateOrgChart(){
		let isPrimary = false;
		if (get_assignment_workgroup?.data?.data?.people_assignment_v0[0]?.assignment_festcloudid_assignmentext?.Type === "Primary") {
			isPrimary = true;
		}
		// Trying to update 
		try{
			await update_people_assignment.run();
			if (update_people_assignment?.data?.errors) {
				throw update_people_assignment?.data?.errors[0].message
			} 

			if (reasonInpt.selectedOptionValue === "blacklist " || reasonInpt.selectedOptionValue === "thirdWarning /greyList") {
				await get_assignment_affiliation.run()
				if (get_assignment_affiliation?.data?.errors) {
					throw get_assignment_affiliation?.data?.errors[0].message
				} 

				if (get_assignment_affiliation?.data?.data?.people_affiliation_v0_aggregate?.aggregate?.count > 0) {
					await update_affiliation.run({type: reasonInpt.selectedOptionValue})
					if (update_affiliation?.data?.errors) {
						throw update_affiliation?.data?.errors[0].message
					} 
				} else {
					await insert_affiliation.run({type: reasonInpt.selectedOptionValue})
					if (insert_affiliation?.data?.errors) {
						throw insert_affiliation?.data?.errors[0].message
					} 
				}
			}

			showAlert(i18n.translate('employeeFiredAlert'), 'success')
			
			if (isPrimary) {
				await get_new_primary.run({
					"id": get_assignment_workgroup?.data?.data?.people_assignment_v0[0]?.assignment_employeefestcloudid_employee?.FestCloudID,
					"today": moment().format("YYYY-MM-DDTHH:mm:ss.SSS")
				});
				if (get_new_primary?.data?.errors) {
					throw get_new_primary?.data?.errors[0].message
				} 

				if (get_new_primary?.data?.data?.people_assignment_v0.length > 0) {
					await update_people_assignmentext_v0.run({
						FestCloudIDs: [get_new_primary?.data?.data?.people_assignment_v0[0]?.FestCloudID],
						Type: "Primary"
					});

					if (update_people_assignmentext_v0?.data?.errors) {
						throw update_people_assignmentext_v0?.data?.errors[0].message
					} 
				}
			}

		}catch(error){
			showAlert(error,'error')
		} finally {
			navigateTo(appsmith.URL.queryParams.returnTo || "Profile_Page", {...appsmith.URL.queryParams, storage: 'internal'})
		}
	},

	handleDateSelected(){
		this.endDate = moment(endDatePicker.formattedDate, 'DD/MM/YYYY').format('YYYY-MM-DDT00:00:00')
	},
}