const modal = document.getElementById('bookDetailModal');
const modalTitle = document.getElementById('modalBookTitle');
const modalImage = document.getElementById('modalBookImage');
const modalPrice = document.getElementById('modalBookPrice');
const modalSeller = document.getElementById('modalBookSeller');
const modalDate = document.getElementById('modalBookDate');
const modalWebLink = document.getElementById('modalBookWeb');
const modalActionArea = document.getElementById('modalActionArea');
const modalMessages = document.getElementById('modalMessages');

function getCsrfToken() {
    return document.querySelector('[name=csrfmiddlewaretoken]').value;
}

// status messages like added to cart, etc. clears after timeout
function showModalMessage(text, type = 'info') {
    modalMessages.innerHTML = `<div class="message ${type}">${text}</div>`;
    setTimeout(() => {
        modalMessages.innerHTML = '';
    }, 5000);
}


function openModalWithBook(bookId) {
    if (!modal) return;

    // fallback
    modalTitle.textContent = 'Loading...';
    modalImage.src = '';
    modalPrice.textContent = '...';
    modalSeller.textContent = '...';
    modalDate.textContent = '...';
    modalWebLink.textContent = '...';
    modalWebLink.href = '#';
    modalActionArea.innerHTML = '';
    modalMessages.innerHTML = '';
    modal.style.display = 'block';

    const url = `/api/book_detail/${bookId}/`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                return response.json().then(errData => {
                    throw new Error(errData.error || `HTTP error! Status: ${response.status}`);
                }).catch(() => {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                throw new Error(data.error);
            }
            modalTitle.textContent = data.name;
            modalImage.src = data.picture_url ? data.picture_url : '/static/default_book_cover.png';
            modalImage.alt = `Cover for ${data.name}`;
            modalPrice.textContent = data.price;
            modalSeller.textContent = data.seller;
            modalDate.textContent = data.publishdate;
            modalWebLink.textContent = data.web;
            modalWebLink.href = data.web;

            modalActionArea.innerHTML = '';

            if (data.is_authenticated) {
                if (data.is_owner) {
                    if (data.delete_url) {
                        const deleteForm = document.createElement('form');
                        deleteForm.method = 'post';
                        deleteForm.action = data.delete_url;
                        deleteForm.style.display = 'inline';
                        deleteForm.onsubmit = function () {
                            return confirm('Are you sure you want to delete this book? This action cannot be undone.');
                        };

                        const csrfInput = document.createElement('input');
                        csrfInput.type = 'hidden';
                        csrfInput.name = 'csrfmiddlewaretoken';
                        csrfInput.value = getCsrfToken();
                        deleteForm.appendChild(csrfInput);

                        const deleteButton = document.createElement('button');
                        deleteButton.type = 'submit';
                        deleteButton.className = 'button button-danger'; // Use danger style
                        deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i> Delete Book';
                        deleteForm.appendChild(deleteButton);

                        modalActionArea.appendChild(deleteForm);
                    }

                } else {
                    const form = document.createElement('form');
                    form.method = 'post';
                    form.action = data.add_to_cart_url;
                    form.style.display = 'inline';
                    form.addEventListener('submit', handleAddToCart); // Use existing AJAX handler

                    const csrfInput = document.createElement('input');
                    csrfInput.type = 'hidden';
                    csrfInput.name = 'csrfmiddlewaretoken';
                    csrfInput.value = getCsrfToken();
                    form.appendChild(csrfInput);

                    const button = document.createElement('button');
                    button.type = 'submit';
                    button.className = 'button';
                    button.innerHTML = '<i class="fas fa-cart-plus"></i> Add to Cart';
                    form.appendChild(button);

                    modalActionArea.appendChild(form);
                }
            } else {
                modalActionArea.innerHTML = `<a href="${data.login_url}" class="button"><i class="fas fa-sign-in-alt"></i> Login to Interact</a>`;
            }
        })
        .catch(error => {
            console.error('Error fetching book details:', error);
            modalTitle.textContent = 'Error';
            modalActionArea.innerHTML = '';
            showModalMessage(`Could not load book details: ${error.message}`, 'error');
            modalImage.src = '/static/default_book_cover.png';
            modalPrice.textContent = 'N/A';
            modalSeller.textContent = 'N/A';
            modalDate.textContent = 'N/A';
            modalWebLink.textContent = 'N/A';
            modalWebLink.href = '#';

        });
}

async function handleAddToCart(event) {
    event.preventDefault();
    const form = event.target;
    const url = form.action;
    const formData = new FormData(form);

    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    modalMessages.innerHTML = '';

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCsrfToken(),
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `HTTP error! Status: ${response.status}`);
        }


        if (data.success) {
            showModalMessage(data.message, 'success');
        }

    } catch (error) {
        console.error('Error adding to cart:', error);
        showModalMessage(`Error: ${error.message}`, 'error');
    } finally {
        submitButton.disabled = false;
        submitButton.innerHTML = '<i class="fas fa-cart-plus"></i> Add to Cart';
    }
}


function closeModal() {
    if (modal) {
        modal.style.display = 'none';
        modalTitle.textContent = '';
        modalImage.src = '';
        modalActionArea.innerHTML = '';
        modalMessages.innerHTML = '';
    }
}

document.addEventListener('click', function (event) {
    const bookTrigger = event.target.closest('[data-book-id]');

    if (bookTrigger) {
        event.preventDefault();
        const bookId = bookTrigger.dataset.bookId;
        openModalWithBook(bookId);
    }

    if (event.target === modal) {
        closeModal();
    }
});

document.addEventListener('keydown', function (event) {
    if (event.key === "Escape" && modal.style.display === 'block') {
        closeModal();
    }
});