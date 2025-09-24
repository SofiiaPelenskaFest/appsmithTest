export default {
	adaptationItems: [],
	attestationItems: [],
	dismissalItems: [],

	async createItemsList () {
		this.adaptationItems = [];
		this.attestationItems = [];
		this.dismissalItems = [];

		for (const assignment of get_all_assignment?.data?.data?.history) {
			const position = String(assignment.assignment_positionfestcloudid_position?.PositionName || assignment.JobTitle);
			const title = position + ' у ' + assignment.assignment_workgroupfestcloudid_workgroup?.Name;

			const item = {
				selectedAssigmentId: assignment.FestCloudID,
				title: title
			}
			
			if (assignment?.assignment_festcloudid_assignmentext?.Substage === "DismissalChecklistPending") {
				if (GetPositionsResponsibleDismiss.data === undefined) {
					await GetPositionsResponsibleDismiss.run();
				}
				if (get_my_position_adaptation?.data === undefined) {
					await get_my_position_dismissal.run();
				}

				if (get_my_position_dismissal?.data?.data?.people_position_v0.length > 0 || assignment?.assignment_festcloudid_assignmentext?.DismissalManagerFestCloudID === appsmith.store.myFestCloudId 
						|| assignment.ManagerFestCloudId === appsmith.store.myFestCloudId) {
					this.dismissalItems.push(item);
				}
			}
		}

		for (const assignment of get_all_assignment?.data?.data?.activeAssignments) {
			const position = String(assignment.assignment_positionfestcloudid_position?.PositionName || assignment.JobTitle);
			const title = position + ' у ' + assignment.assignment_workgroupfestcloudid_workgroup?.Name;

			const item = {
				selectedAssigmentId: assignment.FestCloudID,
				title: title
			}

			if (assignment?.assignment_festcloudid_assignmentext?.Substage === "AdaptationCheckListPending") {
				if (GetPositionsResponsibleAdaptat?.data === undefined) {
					await GetPositionsResponsibleAdaptat.run();
				}
				if (get_my_position_adaptation?.data === undefined) {
					await get_my_position_adaptation.run();
				}

				if (get_my_position_adaptation?.data?.data?.people_position_v0.length > 0 || assignment?.assignment_festcloudid_adaptation?.ResponsibleEmployeeFestCloudID === appsmith.store.myFestCloudId
						|| assignment?.ManagerFestCloudId === appsmith.store.myFestCloudId) {
					this.adaptationItems.push(item);
				}
			}

			if (assignment?.assignment_festcloudid_assignmentext?.Substage === "DismissalChecklistPending") {
				if (GetPositionsResponsibleDismiss.data === undefined) {
					await GetPositionsResponsibleDismiss.run();
				}
				if (get_my_position_adaptation?.data === undefined) {
					await get_my_position_dismissal.run();
				}

				if (get_my_position_dismissal?.data?.data?.people_position_v0.length > 0 || assignment?.assignment_festcloudid_assignmentext?.DismissalManagerFestCloudID === appsmith.store.myFestCloudId 
						|| assignment.ManagerFestCloudId === appsmith.store.myFestCloudId) {
					this.dismissalItems.push(item);
				}
			}

			if (assignment?.assignment_festcloudid_assignmentext?.Substage === "AttestationCheckListPending" ) {
				if (GetAttestationPositions.data === undefined) {
					await GetAttestationPositions.run();
				}

				if (GetPositionsResponsibleAdaptat.data === undefined) {
					await GetPositionsResponsibleAdaptat.run();
				}

				if (get_my_position_adaptation?.data === undefined) {
					await get_my_position_adaptation.run();
				}

				if (JSON.parse(GetAttestationPositions.data).data.includes(position) && (get_my_position_adaptation?.data?.data?.people_position_v0.length > 0 || assignment?.assignment_festcloudid_adaptation?.ResponsibleEmployeeFestCloudID === appsmith.store.myFestCloudId
																																								 || assignment?.ManagerFestCloudId === appsmith.store.myFestCloudId)) {
					this.attestationItems.push(item);
				}
			}
		}
		console.log('dismis', this.dismissalItems)
	}
}

