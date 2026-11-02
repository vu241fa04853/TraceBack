
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from django.contrib.auth import logout
from django.shortcuts import redirect
from django.views.decorators.http import require_POST


@require_POST
def staff_logout(request):
    logout(request)
    return redirect("http://localhost:5173/")


urlpatterns = [
    # Custom logout must come before Django Admin
    path('admin/logout/', staff_logout, name='staff_logout'),

    path('admin/', admin.site.urls),

    path('api/', include('items.urls')),
]

if settings.DEBUG:
    urlpatterns += static(
        settings.MEDIA_URL,
        document_root=settings.MEDIA_ROOT
    )    