export default {
	fileData: null,
	pos: null,
	employeeFestCloudID: appsmith.URL.queryParams.employeeFestCloudID,
	link: appsmith.env.META4_URL,
	Profile_PageLink: "/uk/workspaces/7b221e7d-1189-4546-ad91-ea615fb75afd/cc0eb808-bfff-444b-ad3f-9f073e4e069b",
	substitution: false,
	substitutionEdit: false,
	loading: true,
	showCow: false,
	needAdaptation: true,

	async init() {
		await i18n.setup(appsmith.store.localization || "uk")
		this.substitution = appsmith.URL.queryParams.substitution === "true" ?? true;
		this.substitutionEdit = appsmith.URL.queryParams.substitutionToEditId !== undefined ?? true;

		try {
			await GetPositionsResponsibleAdaptat.run();
			if (GetPositionsResponsibleAdaptat.data.length === 0) {
				throw 'Permissions error'
			}
			await resetWidget('desktop');
			await resetWidget('DropzoneImage');
			await get_roles_user.run();
			if (get_roles_user.data.length === 0) {
				this.showCow = true;
				throw 'Permissions error'
			}
			await get_all__workgroups.run();
			if (get_all__workgroups?.data?.errors) {
				throw get_all__workgroups?.data?.errors[0].message
			}
			await utils.getDeepestWorkgroups();
			await get_all__position.run();
			if (get_all__position?.data?.errors) {
				throw get_all__position?.data?.errors[0].message
			}
			await get_employee.run();
			if (get_employee?.data?.errors) {
				throw get_employee?.data?.errors[0].message
			}
			if (!this.substitution && !init.substitutionEdit) {
				// await get_roles_all.run();
				// if (get_roles_all.data.length === 0) {
				// this.showCow = true;
				// throw 'Permissions error'
				// }
				await get_all__dictionary.run();
				if (get_all__dictionary?.data?.errors) {
					throw get_all__dictionary?.data?.errors[0].message
				}
				await get_contentitems.run();
				if (get_contentitems?.data?.errors) {
					throw get_contentitems?.data?.errors[0].message
				}
			}
			if (this.substitutionEdit) {
				utils.positions = [...get_all__position.data.data.people_position_v0];
				await get_managers.run();
				if (get_managers?.data?.errors) {
					throw get_managers?.data?.errors[0].message
				}
				await get_substitution_assignment.run();
				if (get_substitution_assignment?.data?.errors) {
					throw get_substitution_assignment?.data?.errors[0].message
				}
			}
		} catch (error) {
			showAlert(error,'error')
		} finally {
			init.loading = false;
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

	async handleSubmit() {
		await TokenValidator.validateToken();
		// await get_employee.run();

		let employeeFestCloudID = get_employee.data?.data?.employee[0]?.FestCloudID;
		let shouldCreateRole = false;

		try {
			// If its new person - we have to create employee
			if (!employeeFestCloudID) {
				await insert_employee.run();

				employeeFestCloudID = insert_employee.data?.data?.inserted?.returning[0]?.FestCloudID;

				if (!employeeFestCloudID) {
					showAlert(i18n.translate("employeeNotAddedAlert"), 'error');
					throw insert_employee?.data?.errors[0].message
				}
				shouldCreateRole = true;

			} else {
				await update_employee.run({
					id: employeeFestCloudID
				})
				if (update_employee?.data?.errors) {
					throw update_employee?.data?.errors[0].message
				}
			} 

			// Assignment will be created with that id
			init.employeeFestCloudID = employeeFestCloudID;
			let assigmentFestCloudID = null;

			if (!this.substitution) {
				await insert_role.run();
				// Assignment
				await insert_assignmentext.run();
				if (insert_assignmentext?.data?.errors) {
					// If we got emloyee id from queryParams - we cant delete it
					if (!appsmith.URL.queryParams.employeeFestCloudID) {
						await delete_people_employee.run({id: employeeFestCloudID}) 
					}
					throw insert_assignmentext?.data?.errors[0].message
				}
				// Adaptation
				// await insert_adaptation.run();
				// if (insert_adaptation?.data?.errors) {
				// showAlert(insert_adaptation?.data?.errors[0].message, 'error')
				// }
				assigmentFestCloudID = insert_assignmentext.data?.data?.inserted?.returning[0]?.FestCloudID;
			} else {
				await insert_substitution.run();
				if (insert_substitution?.data?.errors) {
					throw insert_substitution?.data?.errors[0].message
				}
				// SubstitutionResponsible
				// await insert_adaptation.run();
				// if (insert_adaptation?.data?.errors) {
				// showAlert(insert_adaptation?.data?.errors[0].message, 'error')
				// }
				assigmentFestCloudID = insert_substitution.data?.data?.inserted?.returning[0]?.FestCloudID;
			}

			if (this.needAdaptation || this.substitution) {
				await insert_adaptation.run();
				if (insert_adaptation?.data?.errors) {
					showAlert(`Adaptation: ${insert_adaptation?.data?.errors[0].message}`, 'error')
				}
			}
			// Assignment
			// if (!assigmentFestCloudID) {
			// // If we got emloyee id from queryParams - we cant delete it
			// if (!appsmith.URL.queryParams.employeeFestCloudID) {
			// await delete_people_employee.run({id: employeeFestCloudID}) 
			// }
			// 
			// showAlert(i18n.translate("assignmentNotAddedAlert"), 'error');
			// return;
			// }

			// Photo
			if (init.fileData?.length > 0) {
				await uploadFoto.run();
				await update_photoLink.run({
					festCloudID: employeeFestCloudID,
					photoLink: uploadFoto.data?.body[0]?.url,
				});
				if (update_photoLink?.data?.errors) {
					showAlert(`PhotoLink: ${update_photoLink?.data?.errors[0].message}`, 'error')
				}
			}

			// Probation
			if (joinProbationChkbx.isChecked) {
				const dataDisposition = {
					AssignmentFestCloudID: assigmentFestCloudID,
					Type: "ProbationPeriod",
					EndDate: moment(endProbationDate.selectedDate).format('YYYY-MM-DD'),
					StartDate: moment(startDatePickerAssign.selectedDate).format('YYYY-MM-DD'),
				}

				await insert_disposition.run({
					dataDisposition
				})
				if (insert_disposition?.data?.errors) {
					showAlert(`Disposition: ${insert_disposition?.data?.errors[0].message}`, 'error')
				}
			}

			// Access
			const dataAccess = utils.createAssigmentAccessPayload(assigmentFestCloudID);

			if (dataAccess?.length > 0) {
				await insert_contentitemvalues.run({
					dataAccess 
				})
			}
			if (insert_contentitemvalues?.data?.errors) {
				showAlert(`Access: ${insert_contentitemvalues?.data?.errors[0].message}`, 'error')
			}

			const isWaiting = appsmith.URL.queryParams.returnTo === 'Waiting_List';
			// await showAlert('Assignment added successfully!', 'success');
			// 
			// // To show notification
			// await new Promise((res) => setTimeout(res, 2500))

			if (isWaiting) {
				postWindowMessage({ 
					data: { 
						path: `${this.Profile_PageLink}?employeeFestCloudId=${init.employeeFestCloudID}&isMyPage=false` 
					}, 
					type: "NAVIGATE" 
				}, 'window', `${this.link}`);
			} else {
				await navigateTo("Profile_Page", {
					...appsmith.URL.queryParams, 
					storage: 'internal'},
												 "SAME_WINDOW")
				showAlert(i18n.translate("assignmentAddedAlert"), 'success');
			}
		} catch (error) {
			showAlert(error, 'error')
		} finally {
			resetWidget("desktop");
		}
	},

	async handleSubstitutionEdit() {
		if (moment(get_substitution_assignment?.data?.data?.assignment?.StartDate).valueOf() !== moment(EditSubstitutionEndDatePicker.selectedDate).valueOf()) {
			await update_substitution_endDate.run();
			if (update_substitution_endDate?.data?.errors) {
				showAlert(`EndDate: ${update_substitution_endDate?.data?.errors[0].message}`, 'error')
			}
		}
		if (get_substitution_assignment?.data?.data?.assignment?.assignment_festcloudid_adaptation?.ResponsibleEmployeeFestCloudID !== managerSelectAssign.selectedOptionValues[0]) {
			await update_substitution_responsibl.run();
			if (update_substitution_responsibl?.data?.errors) {
				showAlert(`Responsible: ${update_substitution_responsibl?.data?.errors[0].message}`, 'error')
			}
		}
		navigateTo(appsmith.URL.queryParams.returnTo || "Profile_Page", {...appsmith.URL.queryParams, storage: 'internal'})
	},
}
