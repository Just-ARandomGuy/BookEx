from django.contrib import admin
from django.urls import path
from django.urls import include
from django.views.generic.base import TemplateView
from django.conf.urls.static import static
from bookEx import settings
from bookMng.views import Register

urlpatterns = [
    path("admin/", admin.site.urls),
    path('', include('bookMng.urls')),
    path('register/success', TemplateView.as_view(template_name="registration/register_success.html"),
         name='register-success'),
    path('register', Register.as_view(), name='register'),
    path('', include('django.contrib.auth.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
