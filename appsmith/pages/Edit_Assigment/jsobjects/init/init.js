export default {
	// Delete condition
	employeeFestCloudId: appsmith.URL.queryParams.employeeFestCloudId,
	selectedAssigmentId: appsmith.URL.queryParams.selectedAssigmentId,
	fileData: null,
	isLoading: true,
	isFirstRender: true,
	beforeJobTitle: null,
	allAssignmentsRoles: null,
	showCow: false,

	async onPageLoad(){
		await i18n.setup(appsmith.store.localization || "uk")
		await TokenValidator.validateToken();

		try {
			await get_roles_user.run();
			if (get_roles_user.data.length === 0) {
				this.showCow = true;
				throw 'Permissions error'
			}
			await get_workgroups.run();
			if (get_workgroups?.data?.errors) {
				throw get_workgroups?.data?.errors[0].message
			}
			await utils.getDeepestWorkgroups();
			await get_positions.run()
			if (get_positions?.data?.errors) {
				throw get_positions?.data?.errors[0].message
			}
			await get_dictionaries.run();
			if (get_dictionaries?.data?.errors) {
				throw get_dictionaries?.data?.errors[0].message
			}
			await get_assignments.run();
			if (get_assignments?.data?.errors) {
				throw get_assignments?.data?.errors[0].message
			}
			await get_roles.run();
			if (get_roles.data.length === 0) {
				throw 'Roles error'
			}
			await this.handleChangeAssignment(this.selectedAssigmentId);

			this.refreshRoles();
			await GetPositionsResponsibleAdaptat.run();
			if (GetPositionsResponsibleAdaptat.data.length === 0) {
				throw 'Dictitonary error'
			}
			await get_managers.run();
			if (get_managers?.data?.errors) {
				throw get_managers?.data?.errors[0].message
			}
		} catch (error) {
			showAlert(error,'error')
		} finally {
			this.isLoading = false;
		}
	},

	async handleChangeAssignment(id){
		await TokenValidator.validateToken();
		await resetWidget('DropzoneImage')
		if (!this.isFirstRender && id === this.selectedAssigmentId) {
			return;
		}

		this.selectedAssigmentId = id;

		try {
			await get_one_assignment.run({
				id,
			});
			if (get_one_assignment?.data?.errors) {
				throw get_one_assignment?.data?.errors[0].message
			}

			// To avoid query get_assignments
			this.beforeJobTitle = get_one_assignment.data?.data?.assignment[0]?.JobTitle || '';

			if (this.isFirstRender) {
				this.isFirstRender = false;
			}
		} catch (error) {
			showAlert(error,'error')
		}
	},

	async handleSubmit(){	
		this.isLoading = true;
		try{
			await TokenValidator.validateToken();
			let photoLink = get_one_assignment.data?.data?.assignment[0]?.employee?.PhotoLink || '';

			// If user upload photo
			if (this.fileData?.length > 0) {
				await uploadFoto.run();
				photoLink = uploadFoto.data?.body[0]?.url;
			}

			const assigmentId = this.selectedAssigmentId;
			const employeeId = get_one_assignment.data?.data?.assignment[0]?.EmployeeFestCloudID;

			// Main block
			const dataAssigment = {
				WorkgroupFestCloudID: workgroupSelect.selectedOptionValue,
				JobTitle: utils.capitalizeFirstLowerRest(jobTitleInput.text),
				Role: roleSelect.selectedOptionValue,
				ManagerFestCloudId: managerSelect.selectedOptionValue,
			};

			// Main block
			const dataAssigmentext  = {
				CooperationType: cooperationTypeSelect.selectedOptionValue,
			};

			// Main block
			const dataEmployee = {
				PhotoLink: photoLink
			};

			// Main block
			await update_one_assigment.run({
				assigmentId,
				employeeId,
				dataAssigment,
				dataAssigmentext,
				dataEmployee
			})
			if (update_one_assigment?.data?.errors) {
				showAlert(i18n.translate("infoNotUpdatedAlert"), 'error')
				throw update_one_assigment?.data?.errors[0].message
			}

			// Probation
			const beforeProbationDate = get_one_assignment.data?.data?.assignment[0]?.disposition[0]?.EndDate;
			const currentProbationDate = moment(probationEndDate.selectedDate).format('YYYY-MM-DD');
			if (responsibleCheckboxCopy.isChecked && beforeProbationDate !== currentProbationDate) {
				const dataDisposition = {
					EndDate: currentProbationDate
				};

				await update_disposition.run({
					id: this.selectedAssigmentId,
					dataDisposition
				});
			}
			if (update_disposition?.data?.errors) {
				throw `Disposition ${update_disposition?.data?.errors[0].message}`
			}

			const {
				candidatesToAdd, 
				candidatesToDelete,
				candidatesToUpdate,
			} = await utils.getAssigmentAccessPayload();

			// Access block
			if (candidatesToAdd?.length > 0) {
				await insert_contentitemvalues.run({
					dataAccess: candidatesToAdd
				})

				if (insert_contentitemvalues?.data?.errors) {
					throw `Access ${insert_contentitemvalues?.data?.errors[0].message}`
				}
			} 

			// Access block
			if (candidatesToDelete?.length > 0) {
				await delete_contentitemvalues.run({
					id: this.selectedAssigmentId,
					values: candidatesToDelete,
				})
				if (delete_contentitemvalues?.data?.errors) {
					throw `Access ${delete_contentitemvalues?.data?.errors[0].message}`
				}
			}

			// Access block
			if (candidatesToUpdate?.length > 0) {
				await update_contentitemsvalues.run({
					dataAccess: candidatesToUpdate
				})
				if (update_contentitemsvalues?.data?.errors) {
					throw `Access ${update_contentitemsvalues?.data?.errors[0].message}`
				}
			}

			showAlert(i18n.translate("infoUpdatedSuccessAlert"), 'success')
			await insert_role.run();

			await get_assignments.run();
			if (get_assignments?.data?.errors) {
				throw get_assignments?.data?.errors[0].message
			}
			this.refreshRoles();

			await get_one_assignment.run({
				id: this.selectedAssigmentId
			});
			if (get_one_assignment?.data?.errors) {
				throw get_one_assignment?.data?.errors[0].message
			}

			// To avoid query get_assignments
			this.beforeJobTitle = get_one_assignment.data?.data?.assignment[0]?.JobTitle || '';

		} catch(error){
			showAlert(error, 'error')
			// showAlert(i18n.translate("infoNotUpdatedAlert"), 'error')
		} finally {
			this.isLoading = false;
		}
	},

	async handleSelectFile(){
		this.fileData = DropzoneImage.files;

		await closeModal(uploadFotoMdl.name);
	},

	async handleCancelFile(){
		this.fileData = null;

		await closeModal(uploadFotoMdl.name);
		await resetWidget('DropzoneImage')		
	},

	refreshRoles(){
		this.allAssignmentsRoles = get_assignments.data?.data?.assignments?.map(assignment => assignment.Role)
	}
}