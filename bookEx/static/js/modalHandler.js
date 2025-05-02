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
    let token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (!token) {
        token = document.querySelector('[name=csrfmiddlewaretoken]')?.value;
    }
    if (!token) {
        console.error('CSRF token not found!');
    }
    return token;
}

function showModalMessage(text, type = 'info') {
    modalMessages.innerHTML = `<div class="message ${type}">${text}</div>`;
    // clears the message after timeout
    setTimeout(() => {
        if (modalMessages.firstChild && modalMessages.firstChild.textContent === text) {
            modalMessages.innerHTML = '';
        }
    }, 5000);
}

function openModalWithBook(bookId) {
    if (!modal) return;

    modalTitle.textContent = 'Loading...';
    modalImage.src = '/static/images/placeholder_cover.png';
    modalImage.alt = 'Loading book cover...';
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
            modalImage.src = data.picture_url ? data.picture_url : '/static/images/placeholder_cover.png';
            modalImage.alt = `Cover for ${data.name}`;
            modalPrice.textContent = data.price;
            modalSeller.textContent = data.seller;
            modalDate.textContent = data.publishdate;
            modalWebLink.textContent = data.web || 'N/A';
            modalWebLink.href = data.web || '#';
            if (!data.web) {
                modalWebLink.style.pointerEvents = 'none';
                modalWebLink.style.textDecoration = 'none';
                modalWebLink.style.opacity = '0.7';
            } else {
                modalWebLink.style.pointerEvents = '';
                modalWebLink.style.textDecoration = '';
                modalWebLink.style.opacity = '';
            }


            modalActionArea.innerHTML = '';

            if (data.is_authenticated) {
                if (data.is_owner) {
                    if (data.delete_url) {
                        const deleteForm = document.createElement('form');
                        deleteForm.method = 'post';
                        deleteForm.action = data.delete_url;
                        deleteForm.style.display = 'inline';
                        deleteForm.onsubmit = () => confirm('Are you sure you want to delete this book? This action cannot be undone.');

                        const csrfInput = document.createElement('input');
                        csrfInput.type = 'hidden';
                        csrfInput.name = 'csrfmiddlewaretoken';
                        csrfInput.value = getCsrfToken();
                        deleteForm.appendChild(csrfInput);

                        const deleteButton = document.createElement('button');
                        deleteButton.type = 'submit';
                        deleteButton.className = 'button button-danger';
                        deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i> Delete Book';
                        deleteForm.appendChild(deleteButton);

                        modalActionArea.appendChild(deleteForm);
                    }
                } else {
                    if (data.add_to_cart_url) {
                        const cartForm = document.createElement('form');
                        cartForm.method = 'post';
                        cartForm.action = data.add_to_cart_url;
                        cartForm.style.display = 'inline';
                        cartForm.addEventListener('submit', handleAddToCart);

                        const csrfInputCart = document.createElement('input');
                        csrfInputCart.type = 'hidden';
                        csrfInputCart.name = 'csrfmiddlewaretoken';
                        csrfInputCart.value = getCsrfToken();
                        cartForm.appendChild(csrfInputCart);

                        const cartButton = document.createElement('button');
                        cartButton.type = 'submit';
                        cartButton.className = 'button';
                        cartButton.innerHTML = '<i class="fas fa-cart-plus"></i> Add to Cart';
                        cartForm.appendChild(cartButton);
                        modalActionArea.appendChild(cartForm);
                    }
                }
                if (data.toggle_favorite_url) {
                    const favButton = document.createElement('button');
                    favButton.type = 'button';
                    favButton.className = 'button favorite-toggle-button';
                    favButton.dataset.url = data.toggle_favorite_url;
                    favButton.dataset.bookId = data.id;
                    favButton.innerHTML = data.is_favorite
                        ? '<i class="fas fa-heart"></i> Unfavorite'
                        : '<i class="far fa-heart"></i> Favorite';
                    if (data.is_favorite) favButton.classList.add('is-favorite');
                    favButton.addEventListener('click', handleToggleFavorite);
                    modalActionArea.appendChild(favButton);
                }
            } else {
                if (data.login_url) {
                    modalActionArea.innerHTML = `<a href="${data.login_url}" class="button"><i class="fas fa-sign-in-alt"></i> Login to Interact</a>`;
                }
            }
        })
        .catch(error => {
            console.error('Error fetching book details:', error);
            modalTitle.textContent = 'Error';
            modalActionArea.innerHTML = '';
            showModalMessage(`Could not load book details: ${error.message}`, 'error');
            modalImage.src = '/static/images/placeholder_cover.png';
            modalImage.alt = 'Error loading cover';
            modalPrice.textContent = 'N/A';
            modalSeller.textContent = 'N/A';
            modalDate.textContent = 'N/A';
            modalWebLink.textContent = 'N/A';
            modalWebLink.href = '#';
        });
}

async function handleToggleFavorite(event) {
    event.preventDefault();
    event.stopPropagation();

    const button = event.currentTarget;
    const url = button.dataset.url;
    const bookId = button.dataset.bookId;

    if (!url || !bookId) {
        console.error('Toggle favorite URL or Book ID missing on button.');
        showModalMessage('Could not perform action: Missing data.', 'error');
        return;
    }

    if (button.disabled) {
        return;
    }

    button.disabled = true;
    const originalHtml = button.innerHTML;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    modalMessages.innerHTML = '';

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCsrfToken(),
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            let errorMsg = `HTTP error! Status: ${response.status}`;
            try {
                const errData = await response.json();
                errorMsg = errData.message || errData.error || errorMsg;
            } catch (e) {
            }
            throw new Error(errorMsg);
        }

        const data = await response.json();

        if (data.success) {
            button.innerHTML = data.is_favorite ? '<i class="fas fa-heart"></i> Unfavorite' : '<i class="far fa-heart"></i> Favorite';
            button.classList.toggle('is-favorite', data.is_favorite);
            showModalMessage(data.message, 'success');

            if (!data.is_favorite) {
                const favoritesToggle = document.getElementById('favorites-toggle');
                if (favoritesToggle && favoritesToggle.checked) {
                    window.location.reload();
                }
            }
        } else {
            throw new Error(data.message || data.error || 'Action failed on server.');
        }

    } catch (error) {
        console.error('Error during toggle favorite fetch:', error);
        showModalMessage(`Error: ${error.message || 'Could not toggle favorite.'}`, 'error');
        button.innerHTML = originalHtml;
    } finally {
        button.disabled = false;
    }
}

async function handleAddToCart(event) {
    event.preventDefault();
    const form = event.target;
    const url = form.action;
    const formData = new FormData(form);

    const submitButton = form.querySelector('button[type="submit"]');
    if (submitButton.disabled) return;

    submitButton.disabled = true;
    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Adding...';
    modalMessages.innerHTML = '';

    try {
        const response = await fetch(url, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCsrfToken(),
                'X-Requested-With': 'XMLHttpRequest',
                'Accept': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || data.error || `HTTP error! Status: ${response.status}`);
        }

        if (data.success) {
            showModalMessage(data.message, 'success');
        } else {
            throw new Error(data.message || data.error || 'Could not add to cart.');
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
    }
}

document.addEventListener('click', function (event) {
    const bookTrigger = event.target.closest('[data-book-id]');
    const ratingTrigger = event.target.closest('.star-rating');
    const actionButtonTrigger = event.target.closest('#modalActionArea button, #modalActionArea a.button');

    if (bookTrigger && !ratingTrigger && !actionButtonTrigger && !modal.contains(bookTrigger)) {
        event.preventDefault();
        const bookId = bookTrigger.dataset.bookId;
        openModalWithBook(bookId);
    }

    if (event.target === modal) {
        closeModal();
    }

    if (event.target.classList.contains('close-button')) {
        closeModal();
    }
});

document.addEventListener('keydown', function (event) {
    if (event.key === "Escape" && modal && modal.style.display === 'block') {
        closeModal();
    }
});