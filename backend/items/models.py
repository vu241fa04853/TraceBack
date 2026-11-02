from django.db import models
from django.conf import settings

class Item(models.Model):
    STATUS_CHOICES = [
        ('Lost', 'Lost'),
        ('Found', 'Found'),
        ('Returned', 'Returned'),
    ]

    name = models.CharField(max_length=100)
    category = models.CharField(max_length=100)
    location = models.CharField(max_length=200)
    pickup_location = models.CharField(max_length=200, blank=True, default='')
    description = models.TextField()

    image = models.ImageField(
        upload_to='item_photos/',
        blank=True,
        null=True
    )

    contact_name = models.CharField(max_length=100, blank=True, default='')
    contact_phone = models.CharField(max_length=20, blank=True, default='')
    contact_email = models.EmailField(blank=True, default='')

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='Lost'
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
    from django.conf import settings


class HandoverRecord(models.Model):

    item = models.ForeignKey(
        Item,
        on_delete=models.PROTECT,
        related_name='handover_records'
    )

    collector_name = models.CharField(max_length=100)

    collector_phone = models.CharField(max_length=20)

    collector_college_id = models.CharField(
        max_length=50,
        blank=True
    )

    verification_notes = models.TextField(
        blank=True
    )

    handed_over_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT
    )

    handed_over_at = models.DateTimeField(
        auto_now_add=True
    )

    def __str__(self):
        return f"{self.collector_name} - {self.item.name}"    