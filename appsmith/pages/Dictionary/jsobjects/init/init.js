export default {
	async init () {
		await i18n.setup(appsmith.store.localization || "uk");
	}
}