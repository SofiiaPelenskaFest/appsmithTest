export default {
	userPermissions: _.uniq(get_roles_user.data.flatMap(role => role.Permissions.map(permission => permission.Name))),

	permissions: {
		"assignment_view": "assignment_view",
		"assignment_edit": "assignment_edit",
		"context_view": "context_view",
		"content_view": "content_view",
		"content_edit": "content_edit",
		"dictionary_view": "dictionary_view",
		"dictionary_edit": "dictionary_edit",
		"person_edit": "person_edit",
		"person_view": "person_view",
		"position_view": "position_view",
		"position_edit": "position_edit",
		"principal_view": "principal_view",
		"principal_edit": "principal_edit",
		"workgroup_view": "workgroup_view",
		"workgroup_edit": "workgroup_edit",
		"assignment_workgroupfestcloudid_view": "assignment_workgroupfestcloudid_view",
		"assignment_workgroupfestcloudid_edit": "assignment_workgroupfestcloudid_edit"
	},

	isPermissionMatches({operator = 'and', permissions = []}) {
		if(!this.userPermissions) return false

		let isPermissions = false;

		for (const requiredPermission of permissions) {
			const parts = requiredPermission.split('_');
			const action = parts.pop();
			const entity = parts.join('_');

			if (action === 'view') {
				isPermissions = 
					this.userPermissions.includes(`${entity}_view`) || 
					this.userPermissions.includes(`${entity}_edit`) ||
					this.userPermissions.includes(`${entity}_admin`)
			} else if (action === 'edit') {
				isPermissions = this.userPermissions.includes(`${entity}_edit`) || this.userPermissions.includes(`${entity}_admin`)
			} else {
				isPermissions = this.userPermissions.includes(`${entity}_admin`);
			}

			if (operator === 'and' && isPermissions === false) {
				break;
			} else if (operator === 'or' && isPermissions === true) {
				break;
			}
		}

		return isPermissions;
	},


	getRoleByPermission(...requiredPermissions) {
		const userRoles = get_roles_user.data.map(role => ({
			name: role.Name,
			permissions: role.Permissions.map(permission => permission.Name)
		}));

		const correctRole = userRoles.find(role =>
																			 requiredPermissions.every(requiredPermission => {
			const parts = requiredPermission.split('_');
			const action = parts.pop();
			const entity = parts.join('_');

			if (action === 'view') {
				return (
					role.permissions.includes(`${entity}_view`) ||
					role.permissions.includes(`${entity}_edit`) ||
					role.permissions.includes(`${entity}_admin`)
				);
			}

			if (action === 'edit') {
				return (
					role.permissions.includes(`${entity}_edit`) ||
					role.permissions.includes(`${entity}_admin`)
				);
			}

			return role.permissions.includes(`${entity}_admin`);
		})
																			);

		return correctRole?.name || "";
	}
}