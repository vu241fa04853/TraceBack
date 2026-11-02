
from rest_framework import serializers
from .models import Item, HandoverRecord


class ItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = Item
        fields = '__all__'


class HandoverRecordSerializer(serializers.ModelSerializer):

    class Meta:
        model = HandoverRecord
        fields = [
            'id',
            'item',
            'collector_name',
            'collector_phone',
            'collector_college_id',
            'verification_notes',
            'handed_over_by',
            'handed_over_at',
        ]

        read_only_fields = [
            'id',
            'item',
            'handed_over_by',
            'handed_over_at',
        ]

    def validate_collector_name(self, value):
        value = value.strip()

        if len(value) < 3:
            raise serializers.ValidationError(
                "Name must contain at least 3 characters."
            )

        if not all(
            char.isalpha() or char.isspace() or char in ".-'"
            for char in value
        ):
            raise serializers.ValidationError(
                "Name can contain only letters, spaces, dots, hyphens and apostrophes."
            )

        return value

    def validate_collector_phone(self, value):
        value = value.strip().replace(" ", "").replace("-", "")

        if value.startswith("+91"):
            value = value[3:]

        if len(value) != 10 or not value.isdigit() or value[0] not in "6789":
            raise serializers.ValidationError(
                "Enter a valid 10-digit Indian mobile number."
            )

        return value

    def validate_collector_college_id(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "College ID is required."
            )

        if len(value) < 3:
            raise serializers.ValidationError(
                "Enter a valid college ID."
            )

        return value

    def validate_verification_notes(self, value):
        value = value.strip()

        if len(value) < 10:
            raise serializers.ValidationError(
                "Please enter at least 10 characters explaining how ownership was verified."
            )

        return value