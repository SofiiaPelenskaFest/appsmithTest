export default {
  organizeWorkgroups(workgroups) {
    const treeMap = new Map();
    console.log({ workgroups });

    workgroups.forEach((wg) => {
      const node = wg?.assignment_workgroupfestcloudid_workgroup;
      if (!node) return;
      this.addWorkgroup(node, treeMap)(node, treeMap);
    });

    const rootWorkgroups = [];

    treeMap.forEach((workgroup) => {
      if (!workgroup?.workgroup_workgroupfestcloudid_workgroup) {
        // Сортування кореневих воркгруп
        workgroup.children.sort((a, b) => a.title.localeCompare(b.title));
        rootWorkgroups.push(workgroup);
      }
    });

    const rollupFromRoot = (root) => {
      const stack = [root];
      const post = [];
      const seen = new Set();

      while (stack.length) {
        const node = stack.pop();
        if (!node || seen.has(node.id)) continue;
        seen.add(node.id);
        post.push(node);
        if (Array.isArray(node.children)) {
          for (const ch of node.children) {
            if (ch && !seen.has(ch.id)) stack.push(ch);
          }
        }
      }

      for (let i = post.length - 1; i >= 0; i--) {
        const n = post[i];
        const own = n.amountOfAssignmentsCount ?? 0;
        let sumChildren = 0;
        if (Array.isArray(n.children) && n.children.length) {
          for (const ch of n.children) {
            sumChildren += ch.totalAssignmentsCount ?? 0;
          }
        }
        n.childrenAssignmentsCount = sumChildren;
        n.totalAssignmentsCount = own + sumChildren;
      }
    };

    rootWorkgroups.forEach(rollupFromRoot);

    // Сортування самих кореневих воркгруп
    return rootWorkgroups.sort((a, b) => a.title.localeCompare(b.title));
  },

  addWorkgroup(inputWorkgroup, treeMap) {
    return function addWorkgroupToTree(inputWorkgroup, treeMap) {
      if (!inputWorkgroup) return null;

      const {
        FestCloudID,
        Name,
        workgroup_workgroupfestcloudid_workgroup,
        amountOfAssignments,
      } = inputWorkgroup;

      const amountOfAssignmentsCount =
        amountOfAssignments?.aggregate?.count ?? 0;

      if (!treeMap.has(FestCloudID)) {
        treeMap.set(FestCloudID, {
          ...inputWorkgroup,
          id: FestCloudID,
          title: Name || "-----",
          key: FestCloudID,
          children: [],
          amountOfAssignmentsCount,
          childrenAssignmentsCount: 0,
          totalAssignmentsCount: amountOfAssignmentsCount,
        });
      } else {
        const prev = treeMap.get(FestCloudID);
        prev.title = Name || prev.title;
        prev.amountOfAssignmentsCount = amountOfAssignmentsCount;
        prev.workgroup_workgroupfestcloudid_workgroup =
          workgroup_workgroupfestcloudid_workgroup ??
          prev.workgroup_workgroupfestcloudid_workgroup;
      }

      const currentWorkgroup = treeMap.get(FestCloudID);

      if (workgroup_workgroupfestcloudid_workgroup) {
        const parentInTree = addWorkgroupToTree(
          workgroup_workgroupfestcloudid_workgroup,
          treeMap
        );

        if (
          parentInTree &&
          !parentInTree.children?.some(
            (child) => child.id === currentWorkgroup.id
          )
        ) {
          if (!parentInTree.hasOwnProperty("children")) {
            parentInTree.children = [];
          }
          parentInTree.children.push(currentWorkgroup);

          // Сортуємо дітей кожного вузла одразу після додавання
          parentInTree.children.sort((a, b) =>
            a.title.localeCompare(b.title)
          );
        }
      }

      return currentWorkgroup;
    };
  },
};
