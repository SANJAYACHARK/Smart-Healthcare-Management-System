from rest_framework import serializers

from .models import Department


class DepartmentSerializer(
    serializers.ModelSerializer
):

    doctors_count = serializers.SerializerMethodField()

    class Meta:

        model = Department

        fields = [
            "id",
            "name",
            "description",
            "is_active",
            "doctors_count",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "doctors_count",
            "created_at",
            "updated_at",
        ]

    def get_doctors_count(
        self,
        obj,
    ):

        return obj.doctors.count()