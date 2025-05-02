from django.urls import path
from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('postbook', views.postbook, name='postbook'),
    path('displaybooks', views.displaybooks, name='displaybooks'),
    path('booksearch', views.booksearch_ajax, name='booksearch_ajax'),
    path('mybooks', views.mybooks, name='mybooks'),
    # path('book_detail/<int:book_id>', views.book_detail, name='book_detail'),
    path('book_delete/<int:book_id>', views.book_delete, name='book_delete'),
    path('displayCart', views.displayCart, name='displayCart'),
    path('addtocart/<int:book_id>', views.addtocart, name='addtocart'),
    path('removefromcart/<int:book_id>', views.remove_from_cart, name='removefromcart'),
    path('updatecart', views.update_cart, name='updatecart'),
    path('aboutus', views.aboutUs, name='about'),
    path('api/book_detail/<int:book_id>/', views.get_book_detail_json, name='get_book_detail_json'),
    path('rate_book/<int:book_id>', views.rate_book, name='rate_book'),
    path('toggle_favorite/<int:book_id>', views.toggle_favorite, name='toggle_favorite'),
]
