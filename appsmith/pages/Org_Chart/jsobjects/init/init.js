export default {
	loading: true,
	currentUser: null, 
	showCow: false,
	treeData: [],
	link: appsmith.env.META4_URL,
	jwtValidayionLink: appsmith.env.SECURITY_SERVICE_URL,
	Profile_PageLink: "/uk/workspaces/7b221e7d-1189-4546-ad91-ea615fb75afd/cc0eb808-bfff-444b-ad3f-9f073e4e069b",

	async init() {
		await i18n.setup(appsmith.store.localization || "uk");
		storeValue('sort', "descDate");
		postWindowMessage({id: 'fca_people_orgChart', data: {isMounted: true}, type: "MOUNT"}, 'window', this.link);
		windowMessageListener(this.link, async ({data, type}) => {
			if (type === 'TOKENS_UPDATE') {
				TokenValidator.setNewTokens(data)
			}

			if (type === "INIT") {
				const userEmail = appsmith.store.loginedUser;

				if (userEmail) {
					await this.fetchData(userEmail);

				} else {
					const { accessToken, refreshToken, email, roles, lang, deviceType } = data;
					console.log('email from window mess', email)
					const userRole = roles.includes('manager') ? "admin" : "user"

					await storeValue('loginedUser', email);
					await storeValue('localization', lang);
					await storeValue('userRole', userRole);
					await storeValue('deviceType', deviceType);

					if (accessToken && refreshToken) {
						// зберігання токенів
						storeValue('accessToken', accessToken);
						storeValue('refreshToken', refreshToken);
					}

					if(email) {
						await this.fetchData( email);
					} 
				}
			}

			if (type === "RESIZE") {
				const { deviceType } = data;
				storeValue('deviceType', deviceType);
			}
		});
	},

	async fetchData( workEmail ) {
		try {
			await TokenValidator.validateToken()
			await get_roles_user.run();
			if (get_roles_user.data.length === 0) {
				this.showCow = true;
				throw 'Permissions error'
			}
			await utils.getFilter();

			await get_all_stages.run();
			if (get_all_stages?.data?.errors) {
				throw get_all_stages?.data?.errors[0].message
			} 			
			await utils.sortFilterStages();
			await FilterButton1.setSelectedValues(utils.startStages);

			await get_workgroups.run();
			if (get_workgroups?.data?.errors) {
				this.showCow = true;
				throw get_workgroups?.data?.errors[0].message
			} 
			const workGroupList = get_workgroups.data.data.people_assignment_v0
			const data = await TreeMaker.organizeWorkgroups(workGroupList);
			this.treeData = data

			await get_all_candidates_count.run()
			if (get_all_candidates_count?.data?.errors) {
				showAlert(get_all_candidates_count?.data?.errors[0].message , 'error')
			}

			if(typeof get_all_userData_byEmail.run!=='function') return
			const response = await get_all_userData_byEmail.run({ workEmail: workEmail });

			if (response.data.people_contact_v0 && response.data.people_contact_v0.length > 0) {
				// По збереженому з клеймсів мейлу витягуємо фестклаудайді
				const employeeFestCloudId = response.data.people_contact_v0[0].PrincipalFestCloudID;

				if(typeof get_all_data_about_user.run !=='function') return
				await get_all_data_about_user.run({
					"employeeFestCloudID": employeeFestCloudId
				});

				const workgroupId =  get_all_data_about_user.data.data.people_assignment_v0[0].WorkgroupFestCloudID
				if (workgroupId && !appsmith.URL.queryParams.checked && !appsmith.URL.queryParams.expanded) {
					await Workgroup_Tree.setCheckedOptions([workgroupId])
					const expandedWorkgroups = utils.getWorkgroupAncestry(workGroupList, workgroupId)
					await Workgroup_Tree.setExpandedOptions(expandedWorkgroups)

					debData.prevCheck = [workgroupId] // save to memory for Tree trigger func
				} else {
					debData.prevCheck = appsmith.URL.queryParams.checked.split(',')
					await Workgroup_Tree.setCheckedOptions(debData.prevCheck)
					await Workgroup_Tree.setExpandedOptions(appsmith.URL.queryParams.expanded.split(','))
				}
			}

			await get_all_assignments.run();
			if (get_all_assignments?.data?.errors) {
				init.showCow = true;
				throw get_all_assignments?.data?.errors[0].message
			}
		} catch (error) {
			showAlert(error,'error')
		}
		finally {
			this.loading = false;
		}
	}
} 