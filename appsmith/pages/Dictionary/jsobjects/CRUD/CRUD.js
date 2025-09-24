export default {
	async addContentItem() {
		await TokenValidator.validateToken();
		insert_contentitem.run().then(() => {
			showAlert('Content item successfully added', 'success');
			get_all_dictionary.run();
		}).catch(() => {
			showAlert('Content item isn\'t added', 'error');
		});
		closeModal(Modal1.name);
		resetWidget("AddContentItemForm")
	},
	
	async editContentItem() {
		await TokenValidator.validateToken();
		update_contentitem.run().then(() => {
			showAlert('Content item successfully edited', 'success');
			get_all_dictionary.run();
		}).catch(() => {
			showAlert('Content item isn\'t edited', 'error');
		});
		closeModal(Modal1.name);
		resetWidget("AddContentItemForm")
	}
}