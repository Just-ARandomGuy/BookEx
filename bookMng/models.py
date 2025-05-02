from django.contrib.auth.models import User
from django.db import models

from django.conf import settings


class Book(models.Model):
    name = models.CharField(max_length=200)
    web = models.URLField(max_length=300)
    price = models.DecimalField(decimal_places=2, max_digits=8)
    publishdate = models.DateField(auto_now_add=True)
    picture = models.FileField(upload_to='uploads')
    username = models.ForeignKey(User, blank=True, null=True, on_delete=models.CASCADE)
    favorited_by = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='favorite_books', blank=True)


# This is the model for the user shopping cart
class ShoppingCart(models.Model):
    username = models.ForeignKey(User, blank=True, null=True, on_delete=models.CASCADE)


class CartItem(models.Model):
    cart = models.ForeignKey(ShoppingCart, on_delete=models.CASCADE)
    item = models.ForeignKey(Book, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)

    def getPrice(self):
        return self.item.price * self.quantity


class Rating(models.Model):
    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name='ratings')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='book_ratings')
    score = models.PositiveSmallIntegerField(choices=[(i, str(i)) for i in range(1, 6)])

    class Meta:
        unique_together = ('book', 'user')
        indexes = [
            models.Index(fields=['book', 'user']),
        ]

    def __str__(self):
        return f'{self.user.username} rated {self.book.name}: {self.score} stars'
