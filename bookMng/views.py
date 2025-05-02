from django.contrib import messages
from django.db.models import Q, Avg
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.views.generic.edit import CreateView
from django.contrib.auth.forms import UserCreationForm
from django.urls import reverse_lazy, reverse
from django.shortcuts import redirect, render, redirect, get_object_or_404

from .forms import BookForm
from .models import Book, Rating, ShoppingCart, CartItem


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
    books_qs = Book.objects.all().select_related('username')

    from django.db.models.functions import Coalesce
    books_qs = books_qs.annotate(
        average_rating=Coalesce(Avg('ratings__score'), 0.0)
    )

    user_ratings = {}
    if request.user.is_authenticated:
        ratings_qs = Rating.objects.filter(
            user=request.user,
            book__in=books_qs
        ).values('book_id', 'score')
        user_ratings = {rating['book_id']: rating['score'] for rating in ratings_qs}

    processed_books = []
    for book in books_qs:
        book.user_rating_score = user_ratings.get(book.id, None)
        processed_books.append(book)

    context = {
        'books': processed_books,
        'active_nav_item': 'displaybooks'
    }
    return render(request, 'bookMng/displaybooks.html', context)


def mybooks(request):
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


def get_book_detail_json(request, book_id):
    book = Book.objects.select_related('username').get(id=book_id)
    is_owner = request.user.is_authenticated and book.username == request.user

    data = {
        'id': book.id,
        'name': book.name,
        'price': f"{book.price:.2f}",
        'seller': book.username.username if book.username else 'N/A',
        'publishdate': book.publishdate.strftime('%m-%d-%Y'),
        'web': book.web,
        'picture_url': book.picture.url if book.picture else None,
        'is_authenticated': request.user.is_authenticated,
        'is_owner': is_owner,
        'add_to_cart_url': reverse('addtocart', args=[book.id]) if request.user.is_authenticated and not is_owner else None,
    }

    if not data['is_authenticated']:
        next_page_url = reverse('displaybooks')
        data['login_url'] = f"{reverse('login')}?next={next_page_url}"

    if is_owner:
        data['delete_url'] = reverse('book_delete', args=[book.id])
    return JsonResponse(data)


def book_delete(request, book_id):
    book = get_object_or_404(Book, id=book_id, username=request.user)

    if request.method == 'POST':
        book_name = book.name
        book.delete()
        messages.success(request, f"Book '{book_name}' deleted successfully.")
        return redirect('mybooks')
    else:
        messages.warning(request, "Deletion must be done via POST and confirmed via modal")
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
        return JsonResponse({'error': 'Invalid request method'}, status=405)

    if not request.user.is_authenticated:
        messages.error(request, 'You must be logged in to add books to cart!')
        login_url = reverse('login')
        next_url = request.META.get('HTTP_REFERER', reverse('displaybooks'))
        return redirect(f'{login_url}?next={next_url}')

    book = get_object_or_404(Book, id=book_id)

    if book.username == request.user:
        messages.error(request, 'You cannot buy your own books!')

        if request.headers.get('x-requested-with') == 'XMLHttpRequest':
            return JsonResponse({'success': False, 'message': 'You cannot buy your own books!'}, status=400)
        return redirect(request.META.get('HTTP_REFERER', 'displaybooks'))

    cart, created = ShoppingCart.objects.get_or_create(username=request.user)
    cart_item, created = CartItem.objects.get_or_create(cart=cart, item=book)
    if not created:
        cart_item.quantity += 1
        cart_item.save()

    if request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({'success': True, 'message': f"Added '{book.name}' to your cart."})

    return redirect('displayCart')


def remove_from_cart(request, book_id):
    cart = get_object_or_404(ShoppingCart, username=request.user)
    cart_item = get_object_or_404(CartItem, cart=cart, item__id=book_id)

    book_name = cart_item.item.name
    cart_item.delete()
    messages.info(request, f"'{book_name}' has been removed from your cart.")
    return redirect('displayCart')


def aboutUs(request):
    context = {
        'active_nav_item': 'about'
    }
    return render(request, 'bookMng/about_us.html', context)


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
    return redirect('displayCart')


@require_POST
def rate_book(request, book_id):
    if not request.headers.get('x-requested-with') == 'XMLHttpRequest':
        return JsonResponse({'success': False, 'message': 'Invalid request type.'}, status=400)
    if not request.user.is_authenticated:
        return JsonResponse({'success': False, 'message': 'Authentication required to rate books.'}, status=401)

    try:
        book = get_object_or_404(Book.objects.select_related('username'), id=book_id)

        if book.username == request.user:
            return JsonResponse({'success': False, 'message': 'You cannot rate your own books.'}, status=403)

        score_str = request.POST.get('score')
        if not score_str:
            return JsonResponse({'success': False, 'message': 'Invalid score.'}, status=400)

        score = int(score_str)
        if not 1 <= score <= 5:
            raise ValueError("Invalid score value.")

        rating, created = Rating.objects.update_or_create(
            book=book,
            user=request.user,
            defaults={'score': score}
        )

        action = "created" if created else "updated"
        return JsonResponse({
            'success': True,
            'message': f"Rating {action} successfully to {score} stars.",
            'new_rating': score,
            'book_id': book_id
        })

    except Book.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Book not found.'}, status=404)
    except ValueError:
        return JsonResponse({'success': False, 'error': 'Invalid score value provided.'}, status=400)
    except Exception as e:
        print(f"Error rating book: {e}")
        return JsonResponse({'success': False, 'error': 'An server error occurred.'}, status=500)
