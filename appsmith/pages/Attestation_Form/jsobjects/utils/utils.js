export default {
	toUpdate: [],
	toAdd: [],
	attestationList: [],
	readOnly: false,

	readOnlyFunc() {
		if (get_all_assigments?.data?.data?.people_assignment_v0[0]?.ManagerFestCloudId === appsmith.store.myFestCloudId
				|| get_all_assigments?.data?.data?.people_assignment_v0[0]?.assignment_festcloudid_adaptation?.ResponsibleEmployeeFestCloudID === appsmith.store.myFestCloudId) {
			this.readOnly = true;
		}
	},

	formatQuestion: (question) => {
		const match = question.match(/^([^:.]+)[.:]\s*(.+)$/);
		const label = match[1].trim();
		const options = match[2]
		.split(";")
		.map(s => s.trim())
		.filter(Boolean)
		.map(s => s.charAt(0).toUpperCase() + s.slice(1));

		return {
			label,
			options
		}
	},

	atLeatOneChecked () {
		const checked = List1.currentItemsView.reduce(
			(count, item) => item.Checkbox1.isChecked ? count + 1 : count,
			0
		);

		return checked > 0;
	},

	formatGoogleDriveUrl: (url) => {
		const regex = /https:\/\/drive\.google\.com\/file\/d\/([^/]+)\/view/;
		const match = url?.match(regex);
		return match?.[1] 
			? `https://drive.google.com/thumbnail?id=${match[1]}`
		: url;
	},

	submitChanges: async function () {
		if (this.toAdd.length > 0) {
			await insert_contentitemvalues.run({ dataAccess: this.toAdd });

			if (insert_contentitemvalues?.data?.errors) {
				showAlert(insert_contentitemvalues?.data?.errors[0].message , 'error')
				return false
			}
		}

		if (this.toUpdate.length > 0) {
			await update_contentitemsvalues.run({ dataAccess: this.toUpdate });

			if (update_contentitemsvalues?.data?.errors) {
				showAlert(update_contentitemsvalues?.data?.errors[0].message , 'error')
				return false
			}
		}
		return true
	},

	async submitAffiliation() {
		if (get_all_assigments?.data?.data?.people_assignment_v0[0].affiliation_assignmentfestcloudid_array.length > 0) {
			await update_peopleAffiliation.run({result: this.countCheckboxResult()});

			if (update_peopleAffiliation?.data?.errors) {
				showAlert(update_peopleAffiliation?.data?.errors[0].message , 'error')
				return false
			}
		} else {
			await insert_peopleAffiliation.run({result: this.countCheckboxResult()})

			if (insert_peopleAffiliation?.data?.errors) {
				showAlert(insert_peopleAffiliation?.data?.errors[0].message , 'error')
				return false
			}
		}
		return true
	},

	onSubmit: async function () {
		init.loading = true;
		await TokenValidator.validateToken();

		try {
			if (this.submitChanges()) {
				await update_assigment_substage.run({
					"FestCloudIDs": init.assigmentId,
					"Substage": "AttestationCheckListSuccess"
				});
				if (update_assigment_substage?.data?.errors) {
					throw update_assigment_substage?.data?.errors[0].message
				} 

				if (this.submitAffiliation()) {
					await SendAttestationForm.run({
						"Category": "AttestationCheckList",
						"AssignmentFestCloudID": init.assigmentId
					});
					if (SendAttestationForm.data.length === 0) {
						throw 'Sending form error'
					} 
					
					showAlert('Атестаційна форма відправлена успішно', 'success ')
					utils.handleNavigate("Attestation_Result", {selectedAssigmentId: init.assigmentId});
				}
			}
		} catch (error) {
			showAlert(error,'error')
		}
		finally {
			this.toAdd = [];
			this.toUpdate = [];
		}
	},

	onDecline: async function () {
		init.loading = true;
		let isPrimary = false;
		if (get_all_assigments?.data?.data?.people_assignment_v0[0]?.assignment_festcloudid_assignmentext?.Type === "Primary") {
			isPrimary = true;
		}

		try {
			await update_assigment_onDecline.run({
				"id": get_all_assigments.data.data.people_assignment_v0[0].FestCloudID,
				"stage": "OnboardingCancel",
				"dismissalDescription": Input1.text,
				"endDate": moment().format('YYYY-MM-DDTHH:mm:ss.SSS'),
				"Substage": "OnboardingCancel"
			})

			if (update_assigment_onDecline?.data?.errors) {
				throw update_assigment_onDecline?.data?.errors[0].message
			}

			await SendAttestationForm.run()({
				"Category": "OnBoardingCancel",
				"AssignmentFestCloudID": init.assigmentId
			});

			if (SendAttestationForm.data.length === 0) {
				throw 'Sending form error'
			}

			if (isPrimary) {
				await get_new_primary.run({
					"id": get_all_assigments?.data?.data?.people_assignment_v0[0]?.EmployeeFestCloudID,
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

					if (update_people_assignmentext_v0?.data?.errors){
						throw update_people_assignmentext_v0?.data?.errors[0].message
					}
				}
			}

			showAlert('Співпраця завершена', 'success')
			navigateTo(appsmith.URL.queryParams.returnTo || "Profile_Page", {...appsmith.URL.queryParams, storage: 'internal'});

		} catch (error) {
			showAlert(error,'error')
		} finally {
			init.loading = false;
		}
	},

	isExist: (contentItemId) => {
		return get_all_assigments.data.data.people_assignment_v0[0].contentitemvalue_assignmentfestcloudid_array.find(item => item.ContentItemFestCloudID === contentItemId).Value === 'true' 
			? true 
		: false;
	},

	async checkToggle(contentItemId, isChecked) {
		const exist = get_all_assigments.data.data.people_assignment_v0[0].contentitemvalue_assignmentfestcloudid_array.find(item => item.ContentItemFestCloudID === contentItemId);

		if (!exist) {
			const index = this.toAdd.findIndex(item => item.ContentItemFestCloudID === contentItemId);
			const newItem = {
				AssignmentFestCloudID:  get_all_assigments.data.data.people_assignment_v0[0].FestCloudID,
				ContentItemFestCloudID: contentItemId,
				Value: String(isChecked),
			};

			if (index !== -1) {
				this.toAdd[index] = newItem;
			} else {
				this.toAdd.push(newItem);
			}
		} else {
			const index = this.toUpdate.findIndex(entry => entry.where.FestCloudID._eq === exist.FestCloudID);
			const newUpdate = {
				where: { FestCloudID: { _eq: exist.FestCloudID } },
				_set: { Value: String(isChecked) },
			};

			if (index !== -1) {
				this.toUpdate[index] = newUpdate;
			} else {
				this.toUpdate.push(newUpdate);
			}
		}
	},

	async createAttestationList() {
		if (JSON.parse(GetQuestionsFilter.data).data[0] === 'notUse') {
			this.attestationList = [];
		} else {
			this.attestationList = get_all_questions.data.data.people_contentitem_v0.filter(item => GetQuestionsFilter.data.includes(item.ContentKey))
		}
	},

	async handleNavigate(pageSlug, queryParams = {}){
		const employeeFestCloudId = appsmith.URL.queryParams.employeeFestCloudId || appsmith.store.myFestCloudId;
		const returnTo = 'Profile_Page'

		navigateTo(pageSlug, { employeeFestCloudId, returnTo, isMyPage: appsmith.URL.queryParams.isMyPage, checked: appsmith.URL.queryParams.checked,  expanded: appsmith.URL.queryParams.expanded, ...queryParams}, "SAME_WINDOW");
	},

	countCheckboxResult() {
		return (List1.currentItemsView.reduce((acc, value)=> acc + (value.Checkbox1.isChecked ? 1 : 0), 0) / List1.listData.length).toFixed(2).toString()
	}
}