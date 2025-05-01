// ./bookEx/static/js/bookRating.js

document.addEventListener('DOMContentLoaded', function () {
    const bookTableBody = document.getElementById('bookTableBody');
    // Ensure CSRF token is grabbed correctly (it should be if present in the form)
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    // Or grab it from a meta tag if you prefer adding one to base.html

    if (!csrfToken) {
        console.error("CSRF Token not found!");
        // Optionally disable rating or show a message
    }

    // --- Rating Interaction Logic ---
    if (bookTableBody && csrfToken) { // Only proceed if body and token exist
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
                return; // Don't proceed if value is missing
            }

            // --- Optimistic UI Update (same as before) ---
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
            // --- End Optimistic Update ---


            // --- AJAX Request ---
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
                    // Check if response is ok (status 200-299)
                    if (response.ok) {
                        return response.json(); // Parse JSON if ok
                    } else {
                        // If not ok, try to parse JSON error body, then throw error
                        return response.json().then(errData => {
                            // Use 'error' key if present, else 'message' or default text
                            throw new Error(errData.error || errData.message || `Request failed with status ${response.status}`);
                        }).catch(jsonParseError => {
                            // If JSON parsing fails OR errData didn't have specific error, throw generic status error
                            throw new Error(`Request failed with status ${response.status}`);
                        });
                    }
                })
                .then(data => {
                    // This block only runs if response.ok was true
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
                        // This case might not be strictly needed if all non-ok responses throw errors
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
                    // This catches network errors AND errors thrown from the non-ok response handling
                    console.error('Error during rating:', error);
                    if (statusDiv) {
                        // Display the error message from the caught error object
                        statusDiv.textContent = `Error: ${error.message}`;
                        statusDiv.style.color = 'red';
                        setTimeout(() => {
                            statusDiv.textContent = '';
                        }, 5000);
                    }
                    // Optional: Revert optimistic UI update here if needed
                });
        });

        // --- Hover Effects (Keep as they were) ---
        bookTableBody.addEventListener('mouseover', function (event) {
            const starIcon = event.target.closest('.star-rating .star');
            if (!starIcon) return;
            // ... (rest of mouseover code) ...
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
            // ... (rest of mouseout code) ...
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
    } // End if (bookTableBody && csrfToken)
});