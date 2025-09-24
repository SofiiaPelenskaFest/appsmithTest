export default {
	toUpdate: [],
	toAdd: [],
	dismissalList: [],
	readOnly: false,

	readOnlyFunc() {
		if (get_all_assigments?.data?.data?.people_assignment_v0[0]?.ManagerFestCloudId === appsmith.store.myFestCloudId
				|| get_all_assigments?.data?.data?.people_assignment_v0[0]?.assignment_festcloudid_assignmentext?.DismissalManagerFestCloudID === appsmith.store.myFestCloudId) {
			this.readOnly = true;
		}
	},

	isAllChecked () {
		const checked = List1.currentItemsView.reduce(
			(count, item) => item.Checkbox1.isChecked ? count + 1 : count,
			0
		);

		return this.dismissalList.length === checked
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

	onSubmit: async function () {
		init.loading = true;
		await TokenValidator.validateToken();
		const allChecked = this.isAllChecked();

		if (this.toAdd.length > 0) {
			await insert_contentitemvalues.run({ dataAccess: this.toAdd });
			if (insert_contentitemvalues?.data?.errors) {
				throw insert_contentitemvalues?.data?.errors[0].message
			}
		}
		if (this.toUpdate.length > 0) {
			await update_contentitemsvalues.run({ dataAccess: this.toUpdate });
			if (update_contentitemsvalues?.data?.errors) {
				throw update_contentitemsvalues?.data?.errors[0].message
			}
		}

		try {
			if (!allChecked) {
				await get_all_assigments.run();
				if (get_all_assigments?.data?.errors) {
					throw get_all_assigments?.data?.errors[0].message
				}
				this.isAllChecked();
			} else {
				await update_assigment_substage.run();
				if (update_assigment_substage?.data?.errors) {
					throw update_assigment_substage?.data?.errors[0].message
				}
				await SendDismissalForm.run();
				if (SendDismissalForm.data.length === 0) {
					throw 'Sending form error'
				} 

				showAlert('Форма звільнення відправлена успішно', 'success ')
				utils.handleNavigate("Profile_Page", {storage: 'internal'});
			}
		} 
		catch (error) {
			showAlert(error,'error')
		}
		finally {
			init.loading = false;
			this.toUpdate = [];
			this.toAdd = [];
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

	async createDismissalList () {
		if (JSON.parse(GetDismissalFilter.data).data[0] === 'notUse') {
			this.dismissalList = [];
		} else {
			this.dismissalList = get_all_actions.data.data.people_contentitem_v0.filter(item => GetDismissalFilter.data.includes(item.ContentKey))
		}
	},

	async handleNavigate(pageSlug, queryParams = {}){
		const employeeFestCloudId = appsmith.URL.queryParams.employeeFestCloudId || appsmith.store.myFestCloudId;
		const returnTo = 'Profile_Page'

		navigateTo(pageSlug, { employeeFestCloudId, returnTo, isMyPage: appsmith.URL.queryParams.isMyPage, checked: appsmith.URL.queryParams.checked,  expanded: appsmith.URL.queryParams.expanded, ...queryParams}, "SAME_WINDOW");
	},
}