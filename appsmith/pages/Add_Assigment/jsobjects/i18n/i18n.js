export default {
	resources: {
		uk: {
			translation: Constants.defaultLanguageKeys
		},
		en: {
			translation: Constants.enLanguageKeys
		}
	},

	async setup(lang = 'uk') {
		await i18next.init({
			debug: false,
			resources: this.resources
		});
		await i18next.changeLanguage(lang);
		this.translate(); 
	},

	translate(key) {
		if (!key) {
			return i18next.t('defaultKey');
		}
		return i18next.t(key);
	}
}