export default {
	ukMonths: [
		i18n.translate("monthOptionJan"), 
		i18n.translate("monthOptionFeb"), 
		i18n.translate("monthOptionMar"),
		i18n.translate("monthOptionAp"),
		i18n.translate("monthOptionMay"),
		i18n.translate("monthOptionJun"),
		i18n.translate("monthOptionJul"),
		i18n.translate("monthOptionAu"),
		i18n.translate("monthOptionSep"),
		i18n.translate("monthOptionOct"),
		i18n.translate("monthOptionNov"),
		i18n.translate("monthOptionDec"),
	],

	edLevels: 
	{
		"master": i18n.translate("educationLevelSelectOptionMaster"),
		"bachelor": i18n.translate("educationLevelSelectOptionBachelor"),
		"PHD": i18n.translate("educationLevelSelectOptionPHD"),
		"bachelorNotFinished": i18n.translate("educationLevelSelectOptionBachelorNotFinished"),
		"college": i18n.translate("educationLevelSelectOptionCollege"),
		"school": i18n.translate("educationLevelSelectOptionSchool"),
	},

	langLevels: {
		"A1": i18n.translate("languageLevelSelectOptionA1"),
		"A2": i18n.translate("languageLevelSelectOptionA2"),
		"B1": i18n.translate("languageLevelSelectOptionB1"),
		"B2": i18n.translate("languageLevelSelectOptionB2"),
		"C1": i18n.translate("languageLevelSelectOptionC1"),
		"C2": i18n.translate("languageLevelSelectOptionC2"),
	},

	langs: {
		"en": i18n.translate("languageSelectOptionEn"),
		"ar": i18n.translate("languageSelectOptionAr"),
		"bn": i18n.translate("languageSelectOptionBn"),
		"vi": i18n.translate("languageSelectOptionVi"),
		"hi": i18n.translate("languageSelectOptionHi"),
		"el": i18n.translate("languageSelectOptionEl"),
		"he": i18n.translate("languageSelectOptionHe"),
		"id": i18n.translate("languageSelectOptionId"),
		"es": i18n.translate("languageSelectOptionEs"),
		"it": i18n.translate("languageSelectOptionIt"),
		"zh": i18n.translate("languageSelectOptionZh"),
		"ko": i18n.translate("languageSelectOptionKo"),
		"ms": i18n.translate("languageSelectOptionMs"),
		"nl": i18n.translate("languageSelectOptionNl"),
		"de": i18n.translate("languageSelectOptionDe"),
		"no": i18n.translate("languageSelectOptionNo"),
		"pl": i18n.translate("languageSelectOptionPl"),
		"pt": i18n.translate("languageSelectOptionPt"),
		"th": i18n.translate("languageSelectOptionTh"),
		"tr": i18n.translate("languageSelectOptionTr"),
		"uk": i18n.translate("languageSelectOptionUk"),
		"ur": i18n.translate("languageSelectOptionUr"),
		"fi": i18n.translate("languageSelectOptionFi"),
		"fr": i18n.translate("languageSelectOptionFr"),
		"hr": i18n.translate("languageSelectOptionHr"),
		"cs": i18n.translate("languageSelectOptionCs"),
		"sv": i18n.translate("languageSelectOptionSv"),
		"ja": i18n.translate("languageSelectOptionJa")
	},

	formatBirthday: (birthday) => {
		if (!birthday) {
			return i18n.translate("dateNotSpecified"); // Повертаємо повідомлення, якщо дата не задана
		}
		const date = new Date(birthday);
		// Перевіряємо, чи дата є недійсною
		if (isNaN(date.getTime())) {
			return i18n.translate("incorrectDateFormat"); // Повертаємо повідомлення, якщо дата недійсна
		}
		const day = date.getDate();
		const month = this.ukMonths[date.getMonth()];

		return `${day} ${month}`;
	},

	formatGoogleDriveUrl: (url) => {
		const regex = /https:\/\/drive\.google\.com\/file\/d\/([^/]+)\/view/;
		const match = url?.match(regex);
		return match?.[1] 
			? `https://drive.google.com/thumbnail?id=${match[1]}?v=${new Date()}`
		: `${url}?v=${new Date()}`;
	},

	normalizeDate(startDate , endDate) {
		const dateStart = moment(startDate);
		const currentDate = endDate ? moment(endDate) : moment();

		const startCopy = dateStart.clone();
		const years = currentDate.diff(startCopy, 'years');
		startCopy.add(years, 'years');

		const months = currentDate.diff(startCopy, 'months');
		startCopy.add(months, 'months');

		const days = currentDate.diff(startCopy, 'days');
		const startDateFormated = startDate === undefined ? undefined :  `${dateStart.date()} ${this.ukMonths[dateStart.month()]} ${dateStart.year()}`;

		return {
			duration: `${years > 0 ? `${years} рік` : ""} ${months > 0 ? `${months} місяці` : ""} ${days > 0 ? `${days} днів` : ""}`.trim(),
			fullDuration: `${years} рік ${months} місяці ${days} днів`,
			startDate: startDateFormated,
			days,
			months,
			years
		}
	},

	roleTranslations: {
		manager: "Менеджер",
		GM: "Глобальний менеджер",
		worker: "Працівник",
		globaladmin: "Глобальний адміністратор",
		"fca-globaladmin": "Глобальний адміністратор FCA",
		"people-dev": "Розробник персоналу"
	},

	translateRole(role) {
		return this.roleTranslations[role] || role;
	},

	toggleActiveAssignment: async(newPrimaryFestCloudID) => {
		const allActiveAssignments = get_all_assignment.data?.data?.activeAssignments.concat(get_all_assignment.data?.data?.activeSubstitution)
		init.loading = true;
		await TokenService.validateToken();

		const primaryAssigmentIds = allActiveAssignments
		?.filter(assignment => assignment.assignment_festcloudid_assignmentext.Type === "Primary")
		.map(assignment => assignment.FestCloudID);

		try {
			await update_people_assignmentext_v0.run({
				FestCloudIDs: primaryAssigmentIds,
				Type: "Secondary"
			});
			if (update_people_assignmentext_v0?.data?.errors) {
				throw update_people_assignmentext_v0?.data?.errors[0].message
			}

			await update_people_assignmentext_v0.run({
				FestCloudIDs: [newPrimaryFestCloudID],
				Type: "Primary"
			});
			if (update_people_assignmentext_v0?.data?.errors) {
				throw update_people_assignmentext_v0?.data?.errors[0].message
			}
			const employeeFestCloudID = init.isMyPage ? appsmith.store.myFestCloudId : appsmith.store.currentFestCloudId;

			if (teamList.isVisible) {
				resetWidget('teamList');
			}

			await get_all_assignment.run({employeeFestCloudID});
			if (get_all_assignment?.data?.errors) {
				throw get_all_assignment?.data?.errors[0].message
			} 
			await contentItems.createItemsList();

		} catch(error) {
			showAlert(error,'error')
		}
		finally {
			init.loading = false;
		}
	},

	starState(type) {
		return type === 'Primary' 
			? {starColor:'#FFCA0E', isActive: false} 
		: {starColor:'#ffffff', isActive: true};
	},

	async uploadPhoto(){
		try{
			await TokenService.validateToken()

			// Uploading photo on Strapi
			await uploadPhoto.run()

			// Adding photo url from Strapi to DB
			await update_photo.run();

			showAlert(i18n.translate("uploadPhotoSuccessAlert"), 'success')
		}catch(error){
			showAlert(i18n.translate("uploadPhotoWrongAlert"), 'error')

		} finally {
			await closeModal(uploadFotoMdl.name);
			await resetWidget(uploadFotoMdl.name)
		}
	},

	async handleCancelFile() {
		await resetWidget('DropzoneImage');
		await closeModal(uploadFotoMdl.name)
	},

	async handleNavigate(pageSlug, queryParams = {}){
		const employeeFestCloudId = appsmith.URL.queryParams.employeeFestCloudId || appsmith.store.myFestCloudId;
		const returnTo = 'Profile_Page'

		navigateTo(pageSlug, { employeeFestCloudId, returnTo, isMyPage: init.isMyPage, checked: appsmith.URL.queryParams.checked,  expanded: appsmith.URL.queryParams.expanded, ...queryParams}, "SAME_WINDOW");
	},

	formatAdress({ City = '', Street = '', Country = '', BuildingNumber = '', Apartment = '' } = {}) {
		if (City.trim() === '' && Street.trim() === '' && Country.trim() === '') {
			return undefined;
		}
		return `м. ${City}, вул. ${Street} ${BuildingNumber}/${Apartment}, ${Country}`;
	},

	formatPreviousExperience(n = 0) {
		const StartDate = get_all_assignment?.data?.data?.person[0]?.workExperience[n]?.StartDate;
		const EndDate = get_all_assignment?.data?.data?.person[0]?.workExperience[n]?.EndDate;

		if (!StartDate || !EndDate) {
			return undefined;
		}
		return `${moment(StartDate).year()} - ${moment(EndDate).year()} (${moment(EndDate).diff(moment(StartDate), "years")} років)` 
	},

	formatCourseDate(date) {
		if (date) {
			return moment(date, "YYYY-MM-DD").format("DD.MM.YYYY")
		}
		return undefined
	},

	makeWorkgroupPath(node) {
		const path = [];
		const seen = new Set();
		let cur = node;

		while (cur) {
			const id = cur.FestCloudID || null;
			if (id) {
				if (seen.has(id)) {
					break;
				}
				seen.add(id);
			}
			if (cur.Name) {
				path.push({label: cur.Name, value: cur.FestCloudID});
			}
			cur = cur.workgroup_workgroupfestcloudid_workgroup;
		}

		return path.reverse()
	},

	getBredcrumbs(type) {
		const crumbs = []

		if (type === 'active') {
			for (const assignment of get_all_assignment?.data?.data?.activeAssignments) {
				crumbs.push(this.makeWorkgroupPath(assignment.assignment_workgroupfestcloudid_workgroup))
			}
		}

		if (type === 'substitution') {
			for (const assignment of get_all_assignment?.data?.data?.activeSubstitution) {
				crumbs.push(this.makeWorkgroupPath(assignment.assignment_workgroupfestcloudid_workgroup))
			}
		}

		if (type === 'history') {
			for (const assignment of get_all_assignment?.data?.data?.history) {
				crumbs.push(this.makeWorkgroupPath(assignment.assignment_workgroupfestcloudid_workgroup))
			}
		}

		return crumbs
	},

	onDecline: async function (assigmentId) {
		init.loading = true;
		await TokenService.validateToken()

		try {
			await update_assigment_onDecline.run({
				"id": assigmentId,
				"stage": "OnboardingCancel",
				"dismissalDescription": Input1.text,
				"endDate": moment().format("YYYY-MM-DDTHH:mm:ss.SSS"),
				"Substage": "OnboardingCancel"
			})

			if (update_assigment_onDecline?.data?.errors) {
				throw update_assigment_onDecline?.data?.errors[0].message
			} 

			await SendAdaptationForm.run({
				"Category": "OnBoardingCancel",
				"AssignmentFestCloudID": assigmentId
			});

			const employeeFestCloudID = init.isMyPage ? appsmith.store.myFestCloudId : appsmith.store.currentFestCloudId;

			if (get_all_assignment?.data?.data?.primary[0]?.FestCloudID === assigmentId) {
				await get_new_primary.run({
					"id": employeeFestCloudID,
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
			closeModal(submitDeletion.name);
			showAlert('Співпраця завершена', 'success')

			await get_all_assignment.run({employeeFestCloudID});
			if (get_all_assignment.data?.errors) {
				init.showCow = true;
				throw get_all_assignment?.data?.errors[0].message
			} 
			await contentItems.createItemsList();

		} catch (error) {
			showAlert(error,'error')
		} finally {
			init.loading = false;
		}
	},
	
	getExperienceInterval(intervals) {
		if (!intervals || intervals.length === 0) return `${i18n.translate("unknown")}`;

		const today = moment();

		let ranges = intervals.map(i => ({
			start: moment(i.StartDate),
			end: i.EndDate ? moment(i.EndDate) : today
		}));

		let totalDays = 0;
		let currentStart = ranges[0].start;
		let currentEnd = ranges[0].end;

		for (let i = 1; i < ranges.length; i++) {
			let nextStart = ranges[i].start;
			let nextEnd = ranges[i].end;

			if (nextStart.isSameOrBefore(currentEnd)) {
				if (nextEnd.isAfter(currentEnd)) {
					currentEnd = nextEnd;
				}
			} else {
				totalDays += currentEnd.diff(currentStart, "days");
				currentStart = nextStart;
				currentEnd = nextEnd;
			}
		}
		totalDays += currentEnd.diff(currentStart, "days") + 1;

		let base = moment("2000-01-01");
		let end = moment(base).add(totalDays, "days");

		let years = end.diff(base, "years");
		base.add(years, "years");
		let months = end.diff(base, "months");
		base.add(months, "months");
		let days = end.diff(base, "days");

		return `${years > 0 ? years : ""}${years > 0 ? " років " : ""}${months > 0 ? months : ""}${months > 0 ? " місяців " : ""}${days > 0 ? days : ""} днів`
	}
};
