document.addEventListener('DOMContentLoaded', function () {
    const bookTableBody = document.getElementById('bookTableBody');
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

    if (!csrfToken) {
        console.error("CSRF Token not found!");
    }

    if (bookTableBody && csrfToken) {
        bookTableBody.addEventListener('click', function (event) {
            const starIcon = event.target.closest('.star-rating .star');
            if (!starIcon) return;

            const ratingContainer = starIcon.closest('.star-rating');
            const bookId = ratingContainer.dataset.bookId;
            const ratingUrl = ratingContainer.dataset.rateUrl;
            const ratingValue = starIcon.dataset.value;
            const stars = ratingContainer.querySelectorAll('.star');
            const statusDiv = document.getElementById(`status-${bookId}`);

            if (!ratingValue) {
                console.error("Clicked star has no value!", starIcon);
                if (statusDiv) statusDiv.textContent = "Error: Invalid star.";
                return;
            }

            stars.forEach(s => {
                s.classList.remove('selected');
                const icon = s.querySelector('i');
                if (parseInt(s.dataset.value) <= parseInt(ratingValue)) {
                    s.classList.add('selected');
                    if (icon) icon.className = 'fas fa-star';
                } else {
                    if (icon) icon.className = 'far fa-star';
                }
            });
            starIcon.style.transform = 'scale(1.2)';
            setTimeout(() => {
                starIcon.style.transform = 'scale(1)';
            }, 150);

            fetch(ratingUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: `score=${ratingValue}`
            })
                .then(response => {
                    if (response.ok) {
                        return response.json();
                    } else {
                        return response.json().then(errData => {
                            throw new Error(errData.error || errData.message || `Request failed with status ${response.status}`);
                        }).catch(jsonParseError => {
                            throw new Error(`Request failed with status ${response.status}`);
                        });
                    }
                })
                .then(data => {
                    if (data.success) {
                        console.log(`Rating success for book ${bookId}: ${data.message}`);
                        if (statusDiv) {
                            statusDiv.textContent = `Rated ${data.new_rating} ★`;
                            statusDiv.style.color = 'green';
                            setTimeout(() => {
                                statusDiv.textContent = '';
                            }, 3000);
                        }
                    } else {
                        console.error(`Rating failed (but response ok?): ${data.error || data.message}`);
                        if (statusDiv) {
                            statusDiv.textContent = `Error: ${data.error || data.message}`;
                            statusDiv.style.color = 'red';
                            setTimeout(() => {
                                statusDiv.textContent = '';
                            }, 5000);
                        }
                    }
                })
                .catch(error => {
                    console.error('Error during rating:', error);
                    if (statusDiv) {
                        statusDiv.textContent = `Error: ${error.message}`;
                        statusDiv.style.color = 'red';
                        setTimeout(() => {
                            statusDiv.textContent = '';
                        }, 5000);
                    }
                });
        });

        bookTableBody.addEventListener('mouseover', function (event) {
            const starIcon = event.target.closest('.star-rating .star');
            if (!starIcon) return;
            const ratingContainer = starIcon.closest('.star-rating');
            const hoverValue = parseInt(starIcon.dataset.value);
            const stars = ratingContainer.querySelectorAll('.star');

            stars.forEach(s => {
                const icon = s.querySelector('i');
                if (icon) {
                    if (parseInt(s.dataset.value) <= hoverValue) {
                        if (!s.classList.contains('selected') || parseInt(s.dataset.value) <= hoverValue) {
                            icon.className = 'fas fa-star';
                            icon.style.color = 'orange';
                        }
                    } else {
                        if (!s.classList.contains('selected')) {
                            icon.className = 'far fa-star';
                            icon.style.color = '';
                        }
                    }
                }
            });
        });

        bookTableBody.addEventListener('mouseout', function (event) {
            const ratingContainer = event.target.closest('.star-rating');
            if (!ratingContainer) return;
            if (ratingContainer.contains(event.relatedTarget)) return;
            const stars = ratingContainer.querySelectorAll('.star');
            stars.forEach(s => {
                const icon = s.querySelector('i');
                if (icon) {
                    if (s.classList.contains('selected')) {
                        icon.className = 'fas fa-star';
                        icon.style.color = '';
                    } else {
                        icon.className = 'far fa-star';
                        icon.style.color = '';
                    }
                }
            });
        });
    }
});