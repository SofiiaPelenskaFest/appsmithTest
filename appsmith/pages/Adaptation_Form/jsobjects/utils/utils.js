export default {
	toUpdate: [],
	toAdd: [],
	adaptationList: [],
	readOnly: false,

	readOnlyFunc() {
		if (get_all_assigments?.data?.data?.people_assignment_v0[0]?.ManagerFestCloudId === appsmith.store.myFestCloudId
				|| get_all_assigments?.data?.data?.people_assignment_v0[0]?.assignment_festcloudid_adaptation?.ResponsibleEmployeeFestCloudID === appsmith.store.myFestCloudId) {
			this.readOnly = true;
		}
	},

	isAllChecked () {
		const checked = List1.currentItemsView.reduce(
			(count, item) => item.Checkbox1.isChecked ? count + 1 : count,
			0
		);

		return this.adaptationList.length === checked
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

	onSubmit: async function () {
		await TokenValidator.validateToken();
		init.loading = true;
		const allChecked = this.isAllChecked();

		try {
			if (!allChecked) {
				if (this.submitChanges()) {
					await get_all_assigments.run();
					if (get_all_assigments?.data?.errors) {
						throw get_all_assigments?.data?.errors[0].message
					}
					this.isAllChecked();
				}
			} else {
				if (this.submitChanges()) {
					await update_assigment_substage.run({
						"FestCloudIDs": init.assigmentId,
						"Substage": "AdaptationCheckListSuccess"
					});

					if (update_assigment_substage?.data?.errors) {
						throw update_assigment_substage?.data?.errors[0].message
					} 

					await SendAdaptationForm.run({
						"Category": "CheckListAdaptation",
						"AssignmentFestCloudID": init.assigmentId
					});
					if (SendAdaptationForm.data.length === 0) {
						throw 'Sending form error'
					} 

					showAlert('Адаптаційна форма відправлена успішно', 'success ')
					utils.handleNavigate("Profile_Page", {storage: 'internal'});
				}
			}
		} catch (error) {
			showAlert(error,'error')
		} finally {
			this.toUpdate = [];
			this.toAdd = [];
			init.loading = false;
		}
	},

	onDecline: async function () {
		await TokenValidator.validateToken();
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
			
			await SendAdaptationForm.run({
				"Category": "OnBoardingCancel",
				"AssignmentFestCloudID": init.assigmentId
			});

			if (SendAdaptationForm.data.length === 0) {
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

	async createAdaptationList() {
		if (JSON.parse(GetActionFilter.data).data[0] === 'notUse') {
			this.adaptationList = [];
		} else {
			this.adaptationList = get_all_actions.data.data.people_contentitem_v0.filter(item => GetActionFilter.data.includes(item.ContentKey))
		}
	},

	async handleNavigate(pageSlug, queryParams = {}){
		const employeeFestCloudId = appsmith.URL.queryParams.employeeFestCloudId || appsmith.store.myFestCloudId;
		const returnTo = 'Profile_Page'

		navigateTo(pageSlug, { employeeFestCloudId, returnTo, isMyPage: appsmith.URL.queryParams.isMyPage, checked: appsmith.URL.queryParams.checked,  expanded: appsmith.URL.queryParams.expanded, ...queryParams}, "SAME_WINDOW");
	},
}