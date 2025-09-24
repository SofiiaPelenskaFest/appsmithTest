export default {
	role: null,
	fileExcel: null,
	fileName: `${i18n.translate("nameExelFile")}.xlsx`,
	limitExcel: 500,
	isExcelLoading: false,
	stages: [],
	startStages: ["Intern", "NewComer", "Employee", "Substitution", "Outsourcing"],
	//startStages: get_all_stages?.data?.data?.people_assignmentext_v0.filter(item => !item.Stage.toLowerCase().startsWith('ex-')).map(item => item.Stage),

	// Running new request to build Excel file
	async configureExcel(){
		const total = get_all_assignments.data.data.people_assignment_v0_aggregate.aggregate.count
		this.isExcelLoading = true;

		if (total > this.limitExcel) {
			throw new Error(`${i18n.translate("exceededToMakeFileAlert")} (${this.limitExcel})`)
			return
		}

		this.limitExcel = total;
		showAlert(i18n.translate("preparingToMakeFileAlert"), 'info')

		// We have to run new query for not blinking the assignesList
		const { data } = await get_all_assignments_excel.run();
		try {
			if (get_all_assignments_excel?.data?.errors) {
				throw get_all_assignments_excel?.data?.errors[0].message
			} 
			this.limitExcel = 500;

			// We have to filter data that we need. Key -> future column name, Value -> future column value
			const normalizedData = data.people_assignment_v0.map(item => ({
				'Прізвище': item.assignment_employeefestcloudid_employee.employee_festcloudid_person?.FamilyName || '-',
				'Імʼя': item.assignment_employeefestcloudid_employee.employee_festcloudid_person?.Name || '-',
				'По-батькові': item.assignment_employeefestcloudid_employee.employee_festcloudid_person?.MiddleName || '-' ,
				'Посада': item.assignment_positionfestcloudid_position?.PositionName || '-',
				'Пошта': item.assignment_employeefestcloudid_employee.employee_festcloudid_person.person_festcloudid_principal.WorkEmail[0]?.Email || '-',
				'Номер телефону': item.assignment_employeefestcloudid_employee.employee_festcloudid_person.person_festcloudid_principal.WorkPhone[0]?.PhoneNumber || '-',
				'Робоча група': item.assignment_workgroupfestcloudid_workgroup?.Name || '-',
			}))

			// Converting array of object to excel list
			const ws = XLSX.utils.json_to_sheet(normalizedData);

			// New workbook
			const wb = XLSX.utils.book_new();

			// Adding a list ws to workbook wb with name 'Лист1.'. If we need - we can add more lists to one workbook
			XLSX.utils.book_append_sheet(wb, ws, `${i18n.translate("nameExelInnerSheet")}`);

			// Generating Excel-file like base64 string for correct work. 
			const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });

			// For download this file on click
			this.fileExcel =  `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${wbout}`;

		} catch (error) {
			showAlert(error,'error')
		}
	},

	async downloadExcel(){
		try{
			await this.configureExcel();
			showAlert(`${i18n.translate("downloadingFileAlert1")} ${this.fileName} ${i18n.translate("downloadingFileAlert2")}`, 'info')
			download(this.fileExcel, this.fileName);
		}catch(error){
			if (error.message) {
				showAlert(error.message, 'error')
			} else {
				showAlert(`${i18n.translate("somethingWrongFileAlert")} ${this.fileName}`, 'error')
			}
		} finally {
			this.isExcelLoading = false;
		}
	},

	getWorkgroupAncestry(workgroups, targetId) {
		const idMap = new Map();

		for (const item of workgroups) {
			idMap.set(item?.assignment_workgroupfestcloudid_workgroup?.FestCloudID, item);
		}

		let currentNode = idMap.get(targetId)?.assignment_workgroupfestcloudid_workgroup;

		// idk that we need this condition :/
		if (!currentNode?.workgroup_workgroupfestcloudid_workgroup) {
			return [currentNode.FestCloudID]
		};

		currentNode = currentNode.workgroup_workgroupfestcloudid_workgroup

		const path = [];

		while (currentNode) {
			path.push(currentNode.FestCloudID);
			currentNode = currentNode.workgroup_workgroupfestcloudid_workgroup;
		}

		return path;
	},
	formatGoogleDriveUrl: (url) => {
		const regex = /https:\/\/drive\.google\.com\/file\/d\/([^/]+)\/view/;
		const match = url?.match(regex);
		return match?.[1] 
			? `https://drive.google.com/thumbnail?id=${match[1]}`
		: url;
	},

	getFilter() {
		if (get_roles_user.data.find(role => role.name === 'system_manager') || get_roles_user.data.find(role => role.name === 'workgroup_manager')) {
			this.role = 'filter'
		}
	},

	sortFilterStages() {
		const rows = get_all_stages?.data?.data?.people_assignmentext_v0 ?? [];
		const stages = rows
		.map(it => it?.Stage)

		const isEx = s => s.trim().toLowerCase().startsWith('ex-');

		this.stages = [...stages].sort((a, b) => Number(isEx(a)) - Number(isEx(b)));
	},

	async getAllAssignments() {
		await get_all_assignments.run();
		if (get_all_assignments?.data?.errors) {
			init.showCow = true;
			showAlert(get_all_assignments?.data?.errors[0].message , 'error')
		}
	}
};
