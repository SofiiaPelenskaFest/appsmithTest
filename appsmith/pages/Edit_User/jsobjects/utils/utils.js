export default {
	taxonomy: {
		ID_Cards: "ID Cards",
		Paper_Passport: "Paper Passport",
		Individual_Tax_Number: "Individual Tax Number",
	},

	formatGoogleDriveUrl(url) {
		const regex = /https:\/\/drive\.google\.com\/file\/d\/([^/]+)\/view/;
		const match = url?.match(regex);
		return match?.[1] 
			? `https://drive.google.com/thumbnail?id=${match[1]}`
		: url;
	},

	formatDate(data){
		return moment(data).format('YYYY-MM-DD');
	},

	capitalizeFirstLowerRest(str){
		if (!str) {
			return ''
		}
		let trimmedStr = str.trim();
		return trimmedStr.charAt(0).toUpperCase() + trimmedStr.slice(1).toLowerCase();
	},

	formatPhone(phoneNumber){
		let digits = this.clearPhone(phoneNumber);

		if (digits.length < 3) {
			digits = '380';
		} else if(digits.startsWith('380')) {
			digits = digits
		} else if (digits.startsWith('0')) {
			digits = '380' + digits.slice(1);
		} else {
			digits = '380' + digits;
		}

		// If we have more that 12 chars - delete
		digits = digits.slice(0, 12);

		const valid = digits.length === 12

		// Split on groups
		const match = digits.match(/^(\d{0,3})(\d{0,2})(\d{0,3})(\d{0,2})(\d{0,2})$/);

		if (!match) return '+380';

		let formatted = '+';
		if (match[1]) formatted += match[1];           // +380
		if (match[2]) formatted += ' ' + match[2];      // 00
		if (match[3]) formatted += ' ' + match[3];      // 000
		if (match[4]) formatted += ' ' + match[4];      // 00
		if (match[5]) formatted += ' ' + match[5];      // 00

		return {
			formatted: formatted.trim(),
			valid
		};
	},

	correctInput(str) {
		return /^[A-Za-zА-Яа-яІіЇїЄєҐґ]+$/.test(str);
	},

	clearPhone(phoneNumber) {
		return phoneNumber.replace(/\D/g, '')
	},

	isDigitsOnly(str) {
		return /^\d+$/.test(str);
	},
	
	getContact(contacts, type, source){
		return contacts.find(c => c.ContactType === type && c.ContactSource === source)
	},
	
	getTaxonomyByName(name) {
		return get_taxonomy.data?.data?.dms_taxonomy_v0?.find(tax => tax.Name === name);
	},

	isNewPassport(str) {
		return /^\d{9}$/.test(str)
	},

	isOldPassport(str){
		return /^([A-Z]{2}|[А-Я]{2})\d{6}$/i.test(str) && (!/^[А-Я]{2}/i.test(str) || !/[ІЇЄҐ]/i.test(str));
	},

	getPassportByName(passports, name){
		return passports.find(document => document.passport?.passport_document?.document_taxonomy?.Name === name)
	},

	getPassportFields() {
		const passport = documentInput.text.trim();

		let passportSeries = null;
		let passportNumber = null;
		let taxonomyFestCloudID = null;
		let isNewPassport = false;

		if (this.isNewPassport(passport)) {
			passportNumber = passport;
			taxonomyFestCloudID = utils.getTaxonomyByName(utils.taxonomy.ID_Cards).FestCloudID;
			isNewPassport = true;
		} else {
			passportSeries = passport.slice(0,2);
			passportNumber = passport.slice(2);
			taxonomyFestCloudID = utils.getTaxonomyByName(utils.taxonomy.Paper_Passport).FestCloudID;
		}

		return {
			series: passportSeries,
			number: passportNumber,
			taxonomyFestCloudID,
			isNewPassport,
		}
	},
	hoveredListId: '',
	selectedId: '',
}