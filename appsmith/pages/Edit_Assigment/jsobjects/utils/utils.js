export default {
	deepestWorkgroups: [],
	contentItemsKey: {
		RequiresPC: "RequiresPC",
		RequiresCorporateEmail: "RequiresCorporateEmail",
		RequiresMailGroupAccess: "RequiresMailGroupAccess",
		RequiresAccessServer: "RequiresAccessServer",
		Requires1CAcces: "Requires1CAcces",
		RequiresRoomAccess: "RequiresRoomAccess",
		RequiresJiraAccess: "RequiresJiraAccess",
		RequiresPowerBIAccess: "RequiresPowerBIAccess",
		RequiresVideoMonitoringAccess: "RequiresVideoMonitoringAccess",
		RequiresSpartaAccess: "RequiresSpartaAccess",
		RequiresCleverStaffAccess: "RequiresCleverStaffAccess",
		RequiresClickUpAccess: "RequiresClickUpAccess",
	},

	getDictionaryByName(dictionaryName) {
		return get_dictionaries.data?.data?.dict?.filter(d => d.DictionaryName === dictionaryName)
	},

	getContentItemByKey(contentItemKey, isExist = true) {
		return isExist
			? get_one_assignment.data?.data?.assignment?.[0]?.content_items
			?.filter(item => item?.content_item?.ContentKey === contentItemKey)
		: get_contentitems.data?.data?.content_items
			?.filter(item => item.ContentKey === contentItemKey);
	},

	async getAssigmentAccessPayload() {
		const access = access_form.data;
		console.log(access)

		const allCandidatesToAdd = [];
		const allCandidatesToUpdate = [];

		const cidCache = {};
		const ensureCid = async (key) => {
			if (!cidCache[key]) {
				let meta = this.getContentItemByKey(key, false)?.[0];
				if (!meta) {
					await get_contentitems.run();
					meta = this.getContentItemByKey(key, false)?.[0];
				}
				cidCache[key] = meta?.FestCloudID;
			}
			return cidCache[key];
		};

		for (const key in access) {
			if (key.startsWith("Text")) continue;

			const fieldValue = access[key];

			if (Array.isArray(fieldValue)) {
				const currentValues = (fieldValue || []).map(v => String(v));
				const currentSet = new Set(currentValues);

				const existingItems = (this.getContentItemByKey(key) || []).map(it => ({
					FestCloudID: it.FestCloudID,
					Value: String(it.Value),
					Status: (it.Status === 'GRANTED' || it.Status === 'true') ? 'GRANTED' : 'REVOKED'
				}));

				const existingByValue = {};
				for (let i = 0; i < existingItems.length; i++) {
					const e = existingItems[i];
					existingByValue[e.Value] = e;
				}

				for (let i = 0; i < existingItems.length; i++) {
					const e = existingItems[i];
					const shouldBe = currentSet.has(e.Value) ? 'GRANTED' : 'REVOKED';
					if (e.Status !== shouldBe) {
						allCandidatesToUpdate.push({
							where: { FestCloudID: { _eq: e.FestCloudID } },
							_set: { Status: shouldBe }
						});
					}
				}

				for (let i = 0; i < currentValues.length; i++) {
					const v = currentValues[i];
					if (!existingByValue[v]) {
						const cid = await ensureCid(key);
						if (cid) {
							allCandidatesToAdd.push({
								AssignmentFestCloudID: init.selectedAssigmentId,
								ContentItemFestCloudID: cid,
								Value: v,
								Status: 'GRANTED'
							});
						}
					}
				}
			}
			else {
				const existingItems = this.getContentItemByKey(key) || [];
				const hasNew = fieldValue !== undefined && fieldValue !== null && String(fieldValue).trim() !== '';

				const isBoolLike = (v) => typeof v === 'boolean' || ['true','false'].includes(String(v).toLowerCase());
				const toBool = (v) => (typeof v === 'boolean' ? v : String(v).toLowerCase() === 'true');

				if (!existingItems.length) {
					if (hasNew) {
						const cid = await ensureCid(key);
						if (cid) {
							allCandidatesToAdd.push({
								AssignmentFestCloudID: init.selectedAssigmentId,
								ContentItemFestCloudID: cid,
								Value: String(fieldValue),
								Status: isBoolLike(fieldValue) ? (toBool(fieldValue) ? 'GRANTED' : 'REVOKED') : 'GRANTED'
							});
						}
					}
					return;
				}

				if (isBoolLike(fieldValue)) {
					const nextStatus = toBool(fieldValue) ? 'GRANTED' : 'REVOKED';
					const nextValueStr = String(fieldValue);
					for (const it of existingItems) {
						const prevStatus = (it.Status === 'GRANTED' || it.Status === 'true') ? 'GRANTED' : 'REVOKED';
						if (prevStatus !== nextStatus || String(it.Value) !== nextValueStr) {
							allCandidatesToUpdate.push({
								where: { FestCloudID: { _eq: it.FestCloudID } },
								_set: { Status: nextStatus, Value: nextValueStr }
							});
						}
					}
				} else {
					if (!hasNew) {
						for (const it of existingItems) {
							if (it.Status !== 'REVOKED') {
								allCandidatesToUpdate.push({
									where: { FestCloudID: { _eq: it.FestCloudID } },
									_set: { Status: 'REVOKED' }
								});
							}
						}
						return;
					}
					const newVal = String(fieldValue);
					const match = existingItems.find(it => String(it.Value) === newVal);

					for (const it of existingItems) {
						if (String(it.Value) !== newVal && it.Status !== 'REVOKED') {
							allCandidatesToUpdate.push({
								where: { FestCloudID: { _eq: it.FestCloudID } },
								_set: { Status: 'REVOKED' }
							});
						}
					}
					if (match) {
						if (match.Status !== 'GRANTED') {
							allCandidatesToUpdate.push({
								where: { FestCloudID: { _eq: match.FestCloudID } },
								_set: { Status: 'GRANTED' }
							});
						}
					} else {
						const cid = await ensureCid(key);
						if (cid) {
							allCandidatesToAdd.push({
								AssignmentFestCloudID: init.selectedAssigmentId,
								ContentItemFestCloudID: cid,
								Value: newVal,
								Status: 'GRANTED'
							});
						}
					}
				}
			}
		}

		return {
			candidatesToAdd: allCandidatesToAdd,
			candidatesToUpdate: allCandidatesToUpdate
		};
	}, 

	formatGoogleDriveUrl(url){
		const regex = /https:\/\/drive\.google\.com\/file\/d\/([^/]+)\/view/;
		const match = url?.match(regex);

		return match?.[1] 
			? `https://drive.google.com/thumbnail?id=${match[1]}`
		: url;
	},

	capitalizeFirstLowerRest(str){
		if (!str) {
			return ''
		}
		let trimmedStr = str.trim();
		return trimmedStr.charAt(0).toUpperCase() + trimmedStr.slice(1).toLowerCase();
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
	}
}