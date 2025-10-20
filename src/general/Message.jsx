const showMessage = (message, type='error') => {
	const newError = document.createElement('div');
	newError.classList.add('error');
	if (type === 'success') newError.classList.add('success');
	newError.textContent = message;
	const container = document.querySelector('.error_container');
	if (container) container.appendChild(newError);

	setTimeout(() => newError.remove(), 5000);
}

export default showMessage;