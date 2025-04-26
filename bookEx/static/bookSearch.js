document.addEventListener("DOMContentLoaded", () => {

    const searchInput = document.getElementById("searchInput")
    const tableBody = document.getElementById("bookTableBody")
    const searchUrl = searchInput.dataset.searchUrl;
    const searchForm = document.getElementById("searchForm")

    searchInput.addEventListener("keyup", () => {
        const query = event.target.value.toLowerCase();

        fetch(`${searchUrl}?query=${encodeURIComponent(query)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP Error: ${response.statusText}`)
                }
                return response.json()
            })
            .then(data => {
                tableBody.innerHTML = '';

                if (data.books && data.books.length > 0) {
                    data.books.forEach(book => {
                        const bookId = book.id;
                        const bookName = book.name;
                        const bookPrice = book.price;
                        const bookUserName = book.username;
                        const bookPictureUrl = book.picture_url;
                        const bookPicture = bookPictureUrl ? `<img src="${bookPictureUrl}" width="100" alt="Cover for ${bookName}"/>` : '';
                        const row = `
                        <tr>
                            <td>${bookPicture}</td>
                            <td><a href="book_detail/${bookId}">${bookName}</a></td>
                            <td>${bookPrice}</td>
                            <td>${bookUserName}</td>
                        </tr>
                        `;
                        tableBody.innerHTML += row;
                    });
                } else {
                    tableBody.innerHTML = '<tr><td colspan="3">No books found matching your search.</td></tr>';
                }
            })
            .catch(error => {
                console.log('Error fetching or processing search results: ', error);
                tableBody.innerHTML = '<tr><td colspan="3">Error fetching search results.</td></tr>';
            });
    });

    // block form submission if tries hitting enter
    if (searchForm) {
        searchForm.addEventListener("submit", (event) => {
            event.preventDefault();
        })
    }
})