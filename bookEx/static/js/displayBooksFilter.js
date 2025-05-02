document.addEventListener('DOMContentLoaded', function () {
    const favoritesToggle = document.getElementById('favorites-toggle');
    const searchInput = document.getElementById('searchInput');

    if (favoritesToggle) {
        favoritesToggle.addEventListener('change', function () {
            const isChecked = this.checked;
            const currentSearchQuery = searchInput ? searchInput.value : '';

            const currentUrl = new URL(window.location.href);
            const params = new URLSearchParams(currentUrl.search);

            if (isChecked) {
                params.set('favorites', 'on');
            } else {
                params.delete('favorites');
            }

            if (currentSearchQuery) {
                params.set('query', currentSearchQuery);
            } else {
                params.delete('query');
            }

            currentUrl.search = params.toString();
            window.location.href = currentUrl.toString();
        });
    }
});