from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from django.db.models import Q
from django.http import JsonResponse
from django.shortcuts import render

from .models import ShoppingCart, CartItem

from django.views.generic.edit import CreateView
from django.contrib.auth.forms import UserCreationForm
from django.urls import reverse_lazy, reverse
from django.shortcuts import redirect

from .forms import BookForm
from .models import Book


def index(request):
    context = {
        'active_nav_item': 'index'
    }
    return render(request, 'bookMng/index.html', context)


def postbook(request):
    submitted = False

    if not request.user.is_authenticated:
        messages.error(request, 'You must be logged in to post books.')
        login_url = reverse('login')
        postbook_url = reverse('postbook')
        return redirect(f'{login_url}?next={postbook_url}')

    if request.method == 'POST':
        form = BookForm(request.POST, request.FILES)
        if form.is_valid():
            book = form.save(commit=False)
            try:
                book.username = request.user
            except Exception:
                pass
            book.save()
            messages.success(request, 'Book added successfully.')
            return redirect('mybooks')
    else:
        form = BookForm()

    context = {
        'form': form,
        'active_nav_item': 'postbook'
    }
    return render(request, 'bookMng/postbook.html', context)


def displaybooks(request):
    books = Book.objects.all()

    context = {
        'books': books,
        'active_nav_item': 'displaybooks'
    }
    return render(request, 'bookMng/displaybooks.html', context)


def mybooks(request):
    # technically not needed anymore since My Books is hidden unless user is logged in
    if not request.user.is_authenticated:
        return redirect('login')

    books = Book.objects.filter(username=request.user)
    submitted_flag = request.GET.get('submitted') == 'True'

    context = {
        'books': books,
        'active_nav_item': 'mybooks',
        'submitted': submitted_flag,
    }
    return render(request, 'bookMng/mybooks.html', context)


def booksearch_ajax(request):
    query = request.GET.get('query', '')
    books_data = []

    if query:
        books = Book.objects.filter(
            Q(username__username__icontains=query) |
            Q(name__icontains=query)
        )

    else:
        books = Book.objects.all()

    for book in books:
        books_data.append({
            'id': book.id,
            'name': book.name,
            'price': book.price,
            'username': book.username.username if book.username else '',
            'picture_url': book.picture.url if book.picture else '',
        })

    return JsonResponse({'books': books_data})


def book_detail(request, book_id):
    try:
        book = Book.objects.get(id=book_id)

    except Book.DoesNotExist:
        from django.http import Http404
        raise Http404("Book does not exist")

    origin = request.GET.get('from', 'displaybooks')
    active_nav = 'mybooks' if origin == 'mybooks' else 'displaybooks'

    context = {
        'book': book,
        'active_nav_item': active_nav,
        'origin': origin,
    }

    return render(request, 'bookMng/book_detail.html', context)


def book_delete(request, book_id):
    book = get_object_or_404(Book, id=book_id, username=request.user)

    if request.method == 'POST':
        book_name = book.name
        book.delete()
        messages.success(request, f"Book '{book_name}' deleted successfully.")
        return redirect('mybooks')
    else:
        book_name = book.name
        book.delete()
        messages.success(request, f"Book '{book_name}' deleted successfully.")
        return redirect('mybooks')


class Register(CreateView):
    template_name = 'registration/register.html'
    form_class = UserCreationForm
    success_url = reverse_lazy('login')

    def form_valid(self, form):
        form.save()
        messages.success(self.request, 'Registration successful. Please log in.')
        return super().form_valid(form)


def displayCart(request):
    cart1, created = ShoppingCart.objects.get_or_create(username=request.user)
    cart_items = CartItem.objects.filter(cart=cart1)
    total = 0;
    for cart_item in cart_items:
        total += cart_item.getPrice();
    return render(request,
                  'bookMng/displayCart.html',
                  {
                      'cart_items': cart_items,
                      'total': total,
                      'active_nav_item': 'displayCart',
                  })


def addtocart(request, book_id):
    if request.method != 'POST':
        return redirect('book_detail', book_id=book_id)

    if not request.user.is_authenticated:
        messages.error(request, 'You must be logged in to add books to cart!')
        login_url = reverse('login')
        book_detail_url = reverse('book_detail', args=[book_id])
        return redirect(f'{login_url}?next={book_detail_url}')

    book = get_object_or_404(Book, id=book_id)

    if book.username == request.user:
        messages.error(request, 'You cannot buy your own books!')
        return redirect('book_detail', book_id=book_id)

    cart, created = ShoppingCart.objects.get_or_create(username=request.user)
    cart_item, created = CartItem.objects.get_or_create(cart=cart, item=book)
    if not created:
        cart_item.quantity += 1
        cart_item.save()

    messages.success(request, f"Added '{book.name}' to your cart.")
    return redirect('displayCart')


def remove_from_cart(request, book_id):
    cart = get_object_or_404(ShoppingCart, username=request.user)
    cart_item = get_object_or_404(CartItem, cart=cart, item__id=book_id)

    book_name = cart_item.item.name
    cart_item.delete()
    messages.info(request, f"'{book_name}' has been removed from your cart.")
    return redirect('displayCart')


def update_cart(request):
    if request.method == 'POST':
        cart = get_object_or_404(ShoppingCart, username=request.user)
        items_updated = 0
        items_removed = 0

        post_keys = list(request.POST.keys())

        for key in post_keys:
            if key.startswith('quantity_'):
                try:
                    book_id_str = key.split('_')[1]
                    book_id = int(book_id_str)
                    quantity = int(request.POST[key])
                    cart_item = CartItem.objects.get(cart=cart, item_id=book_id)
                    book_name = cart_item.item.name

                    if quantity < 1:
                        cart_item.delete()
                        messages.info(request, f"'{book_name}' has been removed from your cart.")
                        items_removed += 1
                    elif cart_item.quantity != quantity:
                        cart_item.quantity = quantity
                        cart_item.save()
                        items_updated += 1
                except (ValueError, CartItem.DoesNotExist, IndexError):
                    messages.error(request, f'Error updating quantity for item ID {book_id_str}.'
                                            f' Item might not be in your cart or data is invalid.')

        # if items_updated > 0:
        #     messages.success(request, f"Cart updated successfully. "
        #                               f"{items_updated} item quantity(s) changed.")
    return redirect('displayCart')
