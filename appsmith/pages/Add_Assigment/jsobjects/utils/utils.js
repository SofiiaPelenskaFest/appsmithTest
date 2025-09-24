export default {
	previousSelected: [],
	actualSelected: [],
	deepestWorkgroups: [],
	positions: [],
	getDictionaryByName(dictionaryName) {
		return get_all__dictionary?.data?.data?.dict?.filter(d => d.DictionaryName === dictionaryName)
	},

	getContentItemByKey(contentItemKey) {
		return get_contentitems.data?.data?.content_items?.filter(item => item.ContentKey === contentItemKey);
	},

	photoVisible(){
		const file = DropzoneImage.files[0];

		if (!file) {
			return null;
		}

		const correctSize = () => {
			const size = DropzoneImage.files[0].size;

			if (size < 1024) {
				return `${size} Б`
			} else if (size < 1024 * 1024) {
				return `${(size / 1024).toFixed(1)} КБ`;
			} else {
				return `${(size / (1024 * 1024)).toFixed(1)} МБ`
			}
		}

		return{
			data: file.data,
			name: file.name,
			size: correctSize(),
		}
	},

	capitalizeFirstLowerRest(str){
		if (!str) {
			return ''
		}
		let trimmedStr = str.trim();
		return trimmedStr.charAt(0).toUpperCase() + trimmedStr.slice(1).toLowerCase();
	},

	createAssigmentAccessPayload(AssignmentFestCloudID) {
		const allAccessData = access_form.data;
		console.log(allAccessData);
		const payload = [];

		for (const accessKey in allAccessData) {
			if (accessKey.startsWith("Text")) {
				continue;
			}

			const value = allAccessData[accessKey];
			const contentItem = this.getContentItemByKey(accessKey)?.[0];
			if (!contentItem) continue;

			if (Array.isArray(value)) {
				value.forEach(item =>
											payload.push({
					AssignmentFestCloudID,
					ContentItemFestCloudID: contentItem.FestCloudID,
					Value: String(item),
					Status: 'GRANTED'
				})
										 );
			}
			else if (typeof value === "string") {
				if (value.trim() !== "") {
					payload.push({
						AssignmentFestCloudID,
						ContentItemFestCloudID: contentItem.FestCloudID,
						Value: value,
						Status: 'GRANTED'
					});
				}
			}
			else {
				payload.push({
					AssignmentFestCloudID,
					ContentItemFestCloudID: contentItem.FestCloudID,
					Value: String(value),
					Status: value ? "GRANTED" : "REVOKED"
				});
			}
		}

		return payload;
	},

	async createPos(){
		const code = Math.floor(1000 + Math.random() * 9000).toString();
		const splitedCode = code.split('');

		await pos4.setValue(splitedCode[0]);
		await pos3.setValue(splitedCode[1]);
		await pos2.setValue(splitedCode[2]);
		await pos1.setValue(splitedCode[3]);

		init.pos = code;
	},

	async clearPos() {
		await pos4.setValue('');
		await pos3.setValue('');
		await pos2.setValue('');
		await pos1.setValue('');

		init.pos = null;
	},

	getDeepestWorkgroups() {
		const parentWorkgroupIdsArray = [];
		this.deepestWorkgroups = [];

		get_all__workgroups.data.data.people_workgroup_v0.map(workgroup => {
			if (workgroup.WorkgroupFestCloudID) {
				parentWorkgroupIdsArray.push(workgroup.WorkgroupFestCloudID)
			}
		});

		const parentWorkgroupIds = [...new Set(parentWorkgroupIdsArray)];

		get_all__workgroups.data.data.people_workgroup_v0.map(workgroup => {
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

		const positionsDublicated = get_all__position.data.data.people_position_v0.filter(position => (!positionsToExclude.includes(position.PositionName) && positionFilter.includes(position.PositionName)))

		const seen = new Set();
		this.positions = positionsDublicated.filter(item => {
			if (seen.has(item.PositionName)) return false;
			seen.add(item.PositionName);
			return true;
		});
	},
	
	getNeedAdaptation() {
		init.needAdaptation = true;
		if (JSON.parse(GetActionFilter.data).data[0] === "notUse") {
			init.needAdaptation = false;
		}
	}
}
