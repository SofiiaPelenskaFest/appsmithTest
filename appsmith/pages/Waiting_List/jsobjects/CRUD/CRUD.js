export default {

	deleteUser: async (PeopleToDelete) => {
		try {
			await TokenValidator.validateToken();

			const response = await delete_people_principal.run({"festCloudId": PeopleToDelete}); // Запуск мутації для видалення
			const affectedRows = response.data.delete_people_principal_v0.affected_rows;

			if (affectedRows > 0) {
				// Якщо є видалені рядки, виводимо успішне повідомлення
				showAlert(i18n.translate("peopleDeletedSuccessAlert"), 'success');
			} else {
				// Якщо рядки не були видалені, виводимо повідомлення про помилку
				showAlert(i18n.translate("peopleDeletionErrorALert"), 'error');
			}

			// Викликаємо інший запит для оновлення даних
			utils.getAllPeoplePerson();

		} catch (error) {
			// Обробка помилок
			showAlert(`Error: ${error.message}`, 'error');
		}
	}


}