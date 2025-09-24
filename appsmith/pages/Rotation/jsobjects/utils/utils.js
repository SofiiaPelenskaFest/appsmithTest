export default {
	deepestWorkgroups: [],
	positions: [],
	dismissalResponsiblePeople: [],

	assignmentFieldsFilled(type) {
		switch (type) {
			case "old": 
				return (workgroupSelectAssign.isValid && roleSelectAssign.isValid && positionSelectAssign.isValid && managerSelectAssign.isValid && legalEntitTypeSelectAssign.isValid && responsibleInpt.isValid) ? true : false
			case "new": 
				return (newWorkgroupSelectAssign.isValid && newRoleSelectAssign.isValid && newPositionSelectAssign.isValid && newManagerSelectAssign.isValid && newLegalEntitTypeSelectAssign.isValid) ? true : false
			default:
				return false
		}
	},

	getDictionaryByName(dictionaryName) {
		return get_all__dictionary?.data?.data?.dict?.filter(d => d.DictionaryName === dictionaryName)
	},

	getDeepestWorkgroups() {
		const parentWorkgroupIdsArray = [];
		this.deepestWorkgroups = [];

		get_workgroups.data.data.workgroups.map(workgroup => {
			if (workgroup.WorkgroupFestCloudID) {
				parentWorkgroupIdsArray.push(workgroup.WorkgroupFestCloudID)
			}
		});

		const parentWorkgroupIds = [...new Set(parentWorkgroupIdsArray)];

		get_workgroups.data.data.workgroups.map(workgroup => {
			if(!parentWorkgroupIds.includes(workgroup.FestCloudID)) {
				this.deepestWorkgroups.push(
					{label : workgroup.Name,
					 value: workgroup.FestCloudID
					})
			}
		})
	},

	getPositions() {	
		const positionFilter = (JSON.parse(GetPositionsByWorkgroup.data).data) || [];
		let positionsToExclude = [];

		if (get_employee?.data?.data?.employee.length > 0) {
			positionsToExclude = get_employee?.data?.data?.employee[0]?.assignment_employeefestcloudid_array
				.filter(item => (item?.WorkgroupFestCloudID === workgroupSelectAssign.selectedOptionValue) && !item?.assignment_festcloudid_assignmentext?.Stage.trim().toLowerCase().startsWith('ex-'))
				.map(item => item?.assignment_positionfestcloudid_position?.PositionName)
		} 

		const positionsDublicated = get_all__position.data.data.positions.filter(position => (!positionsToExclude.includes(position.PositionName) && positionFilter.includes(position.PositionName)))

		const seen = new Set();
		this.positions = positionsDublicated.filter(item => {
			if (seen.has(item.PositionName)) return false;
			seen.add(item.PositionName);
			return true;
		});
	},

	async getDismissalResponsibleData() {
		const { data } =  await get_dismissal_managers.data;
		console.log(data)

		this.dismissalResponsiblePeople = _.uniqBy(data?.peopleAssignment
																							 .map(person => ({
			label: `${person.assignmentEmployee.employeeInfo.FamilyName} ${person.assignmentEmployee.employeeInfo.Name}`,
			value: person.EmployeeFestCloudID
		})), 'value')
			.sort((personOne, personTwo) => personOne.label.localeCompare(personTwo.label))
	},
}