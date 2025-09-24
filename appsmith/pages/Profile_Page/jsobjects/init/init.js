export default {
	loading: true,
	currentUser: null, 
	showCow: false,
	link: appsmith.env.META4_URL,
	jwtValidayionLink: appsmith.env.SECURITY_SERVICE_URL,
	Org_ChartLink: '/uk/workspaces/7b221e7d-1189-4546-ad91-ea615fb75afd/3ff6a2ad-e8ae-4a67-abaa-e1e1898de3e9',
	isMyPage: appsmith.URL.queryParams.isMyPage === 'true' ? true : false,

	async test() {
		await get_all_assignment.run({employeeFestCloudID: "a6f9c80b-153f-4912-b7bc-3a942cee024d"});
	},

	async init() {
		await i18n.setup(appsmith.store.localization || "uk");

		const storage = appsmith.URL.queryParams.storage;
		if (storage) {
			if(this.isMyPage){
				await this.fetchData({email: appsmith.store.loginedUser})
			}
			else if (!this.isMyPage) {
				this.fetchData({id: appsmith.URL.queryParams.employeeFestCloudId});
			}
		}

		postWindowMessage({id:'fca_people_profilePage', data: {isMounted:true}, type: "MOUNT"}, 'window', this.link);
		windowMessageListener(this.link, async ({data, type}) => {
			if (type === 'TOKENS_UPDATE') {
				TokenService.setNewTokens(data)
			}
			if (type === "INIT") {
				const { accessToken, refreshToken, email, roles, lang, deviceType } = data;
				const userRole = roles.includes('manager') ? "admin" : "user"

				await storeValue('loginedUser', email);
				await storeValue('localization', lang);
				await storeValue('userRole', userRole);
				await storeValue('deviceType', deviceType);

				if (accessToken && refreshToken) {
					await storeValue('accessToken', accessToken);
					await storeValue('refreshToken', refreshToken);
				}

				const employeeFestCloudID = appsmith.URL.queryParams.employeeFestCloudId || null;
				if (employeeFestCloudID && employeeFestCloudID !== appsmith.store.myFestCloudId) {
					this.isMyPage = false;
					await this.fetchData({id: employeeFestCloudID});
					await storeValue('currentFestCloudId', employeeFestCloudID);
					//console.error("Error fetching user data:", error);
					this.loading = false;
				} else {
					this.isMyPage = true;
					await this.fetchData({email});
				}

				if (type === "RESIZE") {
					const { deviceType } = data;
					storeValue('deviceType', deviceType);
				}
			}
		});	
	},

	async fetchData({email, id}) {
		try {
			await TokenService.validateToken();
			await get_roles_user.run();

			if (get_roles_user.data.length === 0) {
				throw 'Permissions error'
			}

			let employeeFestCloudID = id;

			if (email) {
				await get_user_byEmail.run({workEmail: email })
				if (get_user_byEmail.data?.errors) {
					throw get_user_byEmail?.data?.errors[0].message
				}

				employeeFestCloudID =  get_user_byEmail.data?.data?.people_contact_v0[0]?.PrincipalFestCloudID;
				await storeValue('myFestCloudId', employeeFestCloudID);
			}

			await get_all_assignment.run({employeeFestCloudID});
			if (get_all_assignment?.data?.errors) {
				throw get_all_assignment?.data?.errors[0].message
			}

			if (SecurityService.getRoleByPermission(SecurityService.permissions.assignment_edit) !== "" || SecurityService.getRoleByPermission(SecurityService.permissions.assignment_workgroupfestcloudid_edit) !== "") {
				let inserted = 0;
				for (const assignment of get_all_assignment.data.data.people_assignment_v0) {
					if (assignment.assignment_festcloudid_assignmentext === null) {
						await insert_assignment_ext.run({id: assignment.FestCloudID})
						inserted++
					}
				}
				
				if (inserted > 0) {
					await get_all_assignment.run({employeeFestCloudID});
					if (get_all_assignment?.data?.errors) {
						throw get_all_assignment?.data?.errors[0].message
					}
				}
			}
			await get_dms_document.run({employeeFestCloudID})
			if (get_dms_document?.data?.errors) {
				throw get_dms_document?.data?.errors[0].message
			}

			if (!email) {
				await contentItems.createItemsList();
			}
		} catch (error) {
			this.showCow = true;
			showAlert(error,'error')
		} finally {
			this.loading = false;
		}
	},
} 