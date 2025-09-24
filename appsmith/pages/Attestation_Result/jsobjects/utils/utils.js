export default {
	allAttestationList:[],
	personAttestationList: [],
	readOnly: false,

	readOnlyFunc() {
		if (get_all_assigments?.data?.data?.people_assignment_v0[0]?.ManagerFestCloudId === appsmith.store.myFestCloudId
				|| get_all_assigments?.data?.data?.people_assignment_v0[0]?.assignment_festcloudid_adaptation?.ResponsibleEmployeeFestCloudID === appsmith.store.myFestCloudId) {
			this.readOnly = true;
		}
	},

	formatGoogleDriveUrl: (url) => {
		const regex = /https:\/\/drive\.google\.com\/file\/d\/([^/]+)\/view/;
		const match = url?.match(regex);
		return match?.[1] 
			? `https://drive.google.com/thumbnail?id=${match[1]}`
		: url;
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

			await SendAdaptationForm.run({
				"Category": "OnBoardingCancel",
				"AssignmentFestCloudID": get_all_assigments.data.data.people_assignment_v0[0].FestCloudID,
			});

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

			navigateTo(appsmith.URL.queryParams.returnTo || "Profile_Page", {...appsmith.URL.queryParams, storage: 'internal'});

		} catch (error) {
			showAlert(error,'error')
		} finally {
			init.loading = false;
		}
	},

	resultCounter: () => {
		const corretAnswers = this.personAttestationList.filter(item => item.Value === 'true').length;
		const allAnswers = this.allAttestationList.length;
		const percentage = 100 * corretAnswers / allAnswers;
		let passed = false;
		const position = get_all_assigments.data.data.people_assignment_v0[0].assignment_positionfestcloudid_position.PositionName.toLowerCase().trim()

		if ((position === 'офіціант' && percentage >= 80) || (position !== 'офіціант' && percentage >= 60)) {
			passed = true;
		}

		return {
			allAnswers,
			corretAnswers,
			wrongAnswers: allAnswers - corretAnswers,
			percentage,
			passed
		};
	},

	async createAttestationList() {
		if (JSON.parse(GetQuestionsFilter.data).data[0] === 'notUse') {
			this.personAttestationList = [];
			this.allAttestationList = [];
		} else {
			this.personAttestationList = get_all_assigments.data.data.people_assignment_v0[0].attestationItems.filter(item => GetQuestionsFilter.data.includes(item.contentitemvalue_contentitemfestcloudid_contentitem.ContentKey))
			this.allAttestationList = get_all_questions.data.data.people_contentitem_v0.filter(item => GetQuestionsFilter.data.includes(item.ContentKey))
		}
	},

	async handleNavigate(pageSlug, queryParams = {}){
		const employeeFestCloudId = appsmith.URL.queryParams.employeeFestCloudId || appsmith.store.myFestCloudId;
		const returnTo = 'Profile_Page'

		navigateTo(pageSlug, { employeeFestCloudId, returnTo, isMyPage: appsmith.URL.queryParams.isMyPage, checked: appsmith.URL.queryParams.checked,  expanded: appsmith.URL.queryParams.expanded, ...queryParams}, "SAME_WINDOW");
	},
}