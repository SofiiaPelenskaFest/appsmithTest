export default {
	formCounter: 0,
	isFamily: null,

	onPageLoad(){
		this.formCounter = get_family_child.data?.data?.children.length || 1;
		this.isFamily = get_family_identification.data?.data?.family.length > 0;
	},

	async handleSubmit(){
		await TokenValidator.validateToken();

		try {
			if (this.isFamily) {
				await update_identification.run({
					personId: maininfo.employeeID,
					dataIdentification: {
						Children: ChildrenCheckbox.isChecked,
						FamilyStatus: FamilyStatus.selectedOptionValue
					}
				})
				if (update_identification?.data?.errors) {
					throw `Family: ${update_identification?.data?.errors[0].message}`
				}
			} else {
				await insert_identification.run({
					dataIdentification: {
						PersonFestCloudID: maininfo.employeeID,
						Children: ChildrenCheckbox.isChecked,
						FamilyStatus: FamilyStatus.selectedOptionValue
					}
				})
				if (insert_identification?.data?.errors) {
					throw `Family: ${insert_identification?.data?.errors[0].message}`
				}
			}

			if (!ChildrenCheckbox.isChecked && this.formCounter > 0){
				// We only need to delete all children
				await delete_child_all.run();
				if (delete_child_all?.data?.errors) {
					throw `Family: ${delete_child_all?.data?.errors[0].message}`
				}
				this.restoreData();
				switcher.showAlert();
				return;
			}

			const forms = [FormChild0.data, FormChild1.data, FormChild2.data, FormChild3.data, FormChild4.data, FormChild5.data].filter(f => f !== undefined);
			const correctForms = forms.map(form => {

				const Name = Object.keys(form).filter(k => k.startsWith('ChildName'))[0];
				const Birthday = Object.keys(form).filter(k => k.startsWith('ChildBirthday'))[0];

				return {
					Name: form[Name],
					Birthday: form[Birthday]
				}
			}).filter(f => f.Name);

			for (let i = 0; i < correctForms.length; i++) {
				if (get_family_child.data?.data?.children[i]) {
					//update
					await update_child.run({
						festCloudId: get_family_child.data?.data?.children[i].FestCloudID,
						data: {
							Name: utils.capitalizeFirstLowerRest(correctForms[i].Name),
							Birthday: utils.formatDate(correctForms[i].Birthday)
						}
					})
					if (update_child?.data?.errors) {
						throw `Family: ${update_child?.data?.errors[0].message}`
					}

				} else if (!get_family_child.data?.data?.children[i] && correctForms[i].Name) {
					//insert
					await insert_child.run({
						data: {
							PersonFestCloudID: maininfo.employeeID,
							Name: utils.capitalizeFirstLowerRest(correctForms[i].Name),
							Birthday: utils.formatDate(correctForms[i].Birthday)
						}
					});
					if (insert_child?.data?.errors) {
						throw `Family: ${insert_child?.data?.errors[0].message}`
					}
				}
			}
			this.restoreData();
			switcher.showAlert();
		} catch (error) {
			showAlert(error, 'error')
		}
	},

	async addForm(){
		if (this.formCounter === 6) {
			return;
		}

		this.formCounter++;
	},

	async removeForm(num) {
		this.formCounter--;
		await resetWidget(`FormChild${num}`);

		if (get_family_child.data?.data?.children[num]) {
			const festCloudId = get_family_child.data?.data?.children[num].FestCloudID

			try {
				await delete_child.run({
					festCloudId
				});
				if (delete_child?.data?.errors) {
					throw `Family: ${delete_child?.data?.errors[0].message}`
				}
			} catch (error) {
				showAlert(error, 'error')
			}
			this.restoreData();
		}
	},

	async restoreData(){
		try {
			await get_family_child.run();
			if (get_family_child?.data?.errors) {
				throw `${get_family_child?.data?.errors[0].message}`
			}
			await get_family_identification.run();
			if (get_family_identification?.data?.errors) {
				throw `${get_family_identification?.data?.errors[0].message}`
			}
		} catch (error) {
			showAlert(error, 'error')
		}
		this.onPageLoad();
	}
}