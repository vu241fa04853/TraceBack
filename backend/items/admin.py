
from django.contrib import admin
from .models import Item, HandoverRecord


@admin.register(HandoverRecord)
class HandoverRecordAdmin(admin.ModelAdmin):
    list_display = (
        'item',
        'collector_name',
        'collector_phone',
        'collector_college_id',
        'handed_over_by',
        'handed_over_at'
    )

    search_fields = (
        'collector_name',
        'collector_phone',
        'collector_college_id',
        'item__name'
    )

    readonly_fields = ('handed_over_at',)
