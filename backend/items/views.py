
from django.db import transaction

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAdminUser
from rest_framework.authentication import BasicAuthentication

from .models import Item, HandoverRecord
from .serializers import ItemSerializer, HandoverRecordSerializer


class ItemViewSet(viewsets.ModelViewSet):

    queryset = Item.objects.all().order_by('-created_at')
    serializer_class = ItemSerializer

    def get_queryset(self):
        queryset = Item.objects.all().order_by('-created_at')

        item_status = self.request.query_params.get('status')

        if item_status:
            queryset = queryset.filter(status=item_status)

        return queryset

    @action(
        detail=True,
        methods=['post'],
        url_path='handover',
        authentication_classes=[BasicAuthentication],
        permission_classes=[IsAdminUser]
    )
    def handover(self, request, pk=None):

        item = self.get_object()

        if item.status == 'Returned':
            return Response(
                {'error': 'This item has already been collected.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = HandoverRecordSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():

            record = serializer.save(
                item=item,
                handed_over_by=request.user
            )

            item.status = 'Returned'
            item.save()

        return Response(
            {
                'message': 'Handover completed successfully.',
                'record': HandoverRecordSerializer(record).data
            },
            status=status.HTTP_201_CREATED
        )
