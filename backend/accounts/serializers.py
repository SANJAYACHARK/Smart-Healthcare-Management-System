from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password

from .models import (
    User,
    Doctor,
    Receptionist,
)


# ============================================================
# USER SERIALIZER
# ============================================================

class UserSerializer(serializers.ModelSerializer):

    class Meta:
        model = User

        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "phone",
            "role",
            "is_active",
            "date_joined",
        ]

        read_only_fields = [
            "id",
            "role",
            "is_active",
            "date_joined",
        ]


# ============================================================
# USER PROFILE SERIALIZER
# ============================================================

class UserProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = User

        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "phone",
            "role",
            "is_active",
            "date_joined",
        ]

        read_only_fields = [
            "id",
            "username",
            "role",
            "is_active",
            "date_joined",
        ]


# ============================================================
# PATIENT REGISTRATION
# Patients can register themselves.
# ============================================================

class PatientRegistrationSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True,
        min_length=8,
        validators=[validate_password],
    )

    password_confirm = serializers.CharField(
        write_only=True,
        min_length=8,
    )

    class Meta:
        model = User

        fields = [
            "username",
            "first_name",
            "last_name",
            "email",
            "phone",
            "password",
            "password_confirm",
        ]

    def validate(self, attrs):

        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {
                    "password_confirm": "Passwords do not match."
                }
            )

        return attrs

    def validate_username(self, value):

        if User.objects.filter(
            username__iexact=value
        ).exists():
            raise serializers.ValidationError(
                "Username already exists."
            )

        return value

    def validate_email(self, value):

        if User.objects.filter(
            email__iexact=value
        ).exists():
            raise serializers.ValidationError(
                "Email already exists."
            )

        return value

    def create(self, validated_data):

        validated_data.pop("password_confirm")

        password = validated_data.pop("password")

        user = User.objects.create_user(
            password=password,
            role=User.Role.PATIENT,
            **validated_data,
        )

        return user


# ============================================================
# DOCTOR SERIALIZER
# Used for displaying doctors.
# ============================================================

class DoctorSerializer(serializers.ModelSerializer):

    id = serializers.IntegerField(
        source="user.id",
        read_only=True,
    )

    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    first_name = serializers.CharField(
        source="user.first_name",
        read_only=True,
    )

    last_name = serializers.CharField(
        source="user.last_name",
        read_only=True,
    )

    email = serializers.EmailField(
        source="user.email",
        read_only=True,
    )

    phone = serializers.CharField(
        source="user.phone",
        read_only=True,
    )

    is_active = serializers.BooleanField(
        source="user.is_active",
        read_only=True,
    )

    department_name = serializers.CharField(
        source="department.name",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = Doctor

        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "phone",

            "department",
            "department_name",

            "specialization",
            "experience_years",
            "qualification",
            "consultation_fee",

            "is_available",
            "is_active",

            "created_at",
            "updated_at",
        ]


# ============================================================
# CREATE DOCTOR
# ONLY ADMIN SHOULD BE ABLE TO USE THIS
# ============================================================

class CreateDoctorSerializer(serializers.Serializer):

    username = serializers.CharField(
        max_length=150,
    )

    password = serializers.CharField(
        write_only=True,
        min_length=8,
        validators=[validate_password],
    )

    first_name = serializers.CharField(
        max_length=150,
    )

    last_name = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True,
    )

    email = serializers.EmailField()

    phone = serializers.CharField(
        max_length=15,
        required=False,
        allow_blank=True,
    )

    department = serializers.IntegerField(
        required=False,
        allow_null=True,
    )

    specialization = serializers.CharField(
        max_length=150,
    )

    experience_years = serializers.IntegerField(
        min_value=0,
        default=0,
    )

    qualification = serializers.CharField(
        max_length=200,
        required=False,
        allow_blank=True,
    )

    consultation_fee = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=0,
        default=0,
    )

    def validate_username(self, value):

        if User.objects.filter(
            username__iexact=value
        ).exists():
            raise serializers.ValidationError(
                "Username already exists."
            )

        return value

    def validate_email(self, value):

        if User.objects.filter(
            email__iexact=value
        ).exists():
            raise serializers.ValidationError(
                "Email already exists."
            )

        return value

    def validate_department(self, value):

        if value is None:
            return value

        from departments.models import Department

        department = Department.objects.filter(
            id=value,
            is_active=True,
        ).first()

        if not department:
            raise serializers.ValidationError(
                "Invalid or inactive department."
            )

        return value

    def create(self, validated_data):

        from departments.models import Department

        department_id = validated_data.pop(
            "department",
            None,
        )

        password = validated_data.pop(
            "password"
        )

        department = None

        if department_id is not None:
            department = Department.objects.get(
                id=department_id
            )

        user = User.objects.create_user(
            username=validated_data.pop("username"),
            password=password,
            first_name=validated_data.pop("first_name"),
            last_name=validated_data.pop(
                "last_name",
                "",
            ),
            email=validated_data.pop("email"),
            phone=validated_data.pop(
                "phone",
                "",
            ),
            role=User.Role.DOCTOR,
        )

        doctor = Doctor.objects.create(
            user=user,
            department=department,
            **validated_data,
        )

        return doctor


# ============================================================
# UPDATE DOCTOR
# ONLY ADMIN SHOULD BE ABLE TO USE THIS
# ============================================================

class UpdateDoctorSerializer(serializers.Serializer):

    first_name = serializers.CharField(
        max_length=150,
        required=False,
    )

    last_name = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True,
    )

    email = serializers.EmailField(
        required=False,
    )

    phone = serializers.CharField(
        max_length=15,
        required=False,
        allow_blank=True,
    )

    department = serializers.IntegerField(
        required=False,
        allow_null=True,
    )

    specialization = serializers.CharField(
        max_length=150,
        required=False,
    )

    experience_years = serializers.IntegerField(
        min_value=0,
        required=False,
    )

    qualification = serializers.CharField(
        max_length=200,
        required=False,
        allow_blank=True,
    )

    consultation_fee = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        min_value=0,
        required=False,
    )

    is_available = serializers.BooleanField(
        required=False,
    )

    def validate_email(self, value):

        doctor = self.context.get("doctor")

        if doctor:

            email_exists = (
                User.objects
                .filter(email__iexact=value)
                .exclude(id=doctor.user.id)
                .exists()
            )

            if email_exists:
                raise serializers.ValidationError(
                    "Email already exists."
                )

        return value

    def validate_department(self, value):

        if value is None:
            return value

        from departments.models import Department

        department = Department.objects.filter(
            id=value,
            is_active=True,
        ).first()

        if not department:
            raise serializers.ValidationError(
                "Invalid or inactive department."
            )

        return value

    def update(
        self,
        instance,
        validated_data,
    ):

        from departments.models import Department

        user = instance.user

        user_fields = [
            "first_name",
            "last_name",
            "email",
            "phone",
        ]

        for field in user_fields:

            if field in validated_data:

                setattr(
                    user,
                    field,
                    validated_data.pop(field),
                )

        user.save()

        if "department" in validated_data:

            department_id = validated_data.pop(
                "department"
            )

            if department_id is None:

                instance.department = None

            else:

                instance.department = (
                    Department.objects.get(
                        id=department_id
                    )
                )

        doctor_fields = [
            "specialization",
            "experience_years",
            "qualification",
            "consultation_fee",
            "is_available",
        ]

        for field in doctor_fields:

            if field in validated_data:

                setattr(
                    instance,
                    field,
                    validated_data[field],
                )

        instance.save()

        return instance


# ============================================================
# RECEPTIONIST SERIALIZER
# ============================================================

class ReceptionistSerializer(
    serializers.ModelSerializer
):

    id = serializers.IntegerField(
        source="user.id",
        read_only=True,
    )

    username = serializers.CharField(
        source="user.username",
        read_only=True,
    )

    first_name = serializers.CharField(
        source="user.first_name",
        read_only=True,
    )

    last_name = serializers.CharField(
        source="user.last_name",
        read_only=True,
    )

    email = serializers.EmailField(
        source="user.email",
        read_only=True,
    )

    phone = serializers.CharField(
        source="user.phone",
        read_only=True,
    )

    is_active = serializers.BooleanField(
        source="user.is_active",
        read_only=True,
    )

    class Meta:
        model = Receptionist

        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "phone",

            "employee_id",

            "is_active",

            "created_at",
            "updated_at",
        ]


# ============================================================
# CREATE RECEPTIONIST
# ONLY ADMIN SHOULD BE ABLE TO USE THIS
# ============================================================

class CreateReceptionistSerializer(
    serializers.Serializer
):

    username = serializers.CharField(
        max_length=150,
    )

    password = serializers.CharField(
        write_only=True,
        min_length=8,
        validators=[validate_password],
    )

    first_name = serializers.CharField(
        max_length=150,
    )

    last_name = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True,
    )

    email = serializers.EmailField()

    phone = serializers.CharField(
        max_length=15,
        required=False,
        allow_blank=True,
    )

    employee_id = serializers.CharField(
        max_length=50,
    )

    def validate_username(self, value):

        if User.objects.filter(
            username__iexact=value
        ).exists():
            raise serializers.ValidationError(
                "Username already exists."
            )

        return value

    def validate_email(self, value):

        if User.objects.filter(
            email__iexact=value
        ).exists():
            raise serializers.ValidationError(
                "Email already exists."
            )

        return value

    def validate_employee_id(self, value):

        if Receptionist.objects.filter(
            employee_id__iexact=value
        ).exists():
            raise serializers.ValidationError(
                "Employee ID already exists."
            )

        return value

    def create(
        self,
        validated_data,
    ):

        password = validated_data.pop(
            "password"
        )

        employee_id = validated_data.pop(
            "employee_id"
        )

        user = User.objects.create_user(
            username=validated_data.pop(
                "username"
            ),

            password=password,

            first_name=validated_data.pop(
                "first_name"
            ),

            last_name=validated_data.pop(
                "last_name",
                "",
            ),

            email=validated_data.pop(
                "email"
            ),

            phone=validated_data.pop(
                "phone",
                "",
            ),

            role=User.Role.RECEPTIONIST,
        )

        receptionist = Receptionist.objects.create(
            user=user,
            employee_id=employee_id,
        )

        return receptionist


# ============================================================
# UPDATE RECEPTIONIST
# ONLY ADMIN SHOULD BE ABLE TO USE THIS
# ============================================================

class UpdateReceptionistSerializer(
    serializers.Serializer
):

    first_name = serializers.CharField(
        max_length=150,
        required=False,
    )

    last_name = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True,
    )

    email = serializers.EmailField(
        required=False,
    )

    phone = serializers.CharField(
        max_length=15,
        required=False,
        allow_blank=True,
    )

    employee_id = serializers.CharField(
        max_length=50,
        required=False,
    )

    def validate_email(self, value):

        receptionist = self.context.get(
            "receptionist"
        )

        if receptionist:

            email_exists = (
                User.objects
                .filter(email__iexact=value)
                .exclude(id=receptionist.user.id)
                .exists()
            )

            if email_exists:

                raise serializers.ValidationError(
                    "Email already exists."
                )

        return value

    def validate_employee_id(
        self,
        value,
    ):

        receptionist = self.context.get(
            "receptionist"
        )

        queryset = Receptionist.objects.filter(
            employee_id__iexact=value
        )

        if receptionist:

            queryset = queryset.exclude(
                id=receptionist.id
            )

        if queryset.exists():

            raise serializers.ValidationError(
                "Employee ID already exists."
            )

        return value

    def update(
        self,
        instance,
        validated_data,
    ):

        user = instance.user

        user_fields = [
            "first_name",
            "last_name",
            "email",
            "phone",
        ]

        for field in user_fields:

            if field in validated_data:

                setattr(
                    user,
                    field,
                    validated_data.pop(field),
                )

        user.save()

        if "employee_id" in validated_data:

            instance.employee_id = (
                validated_data["employee_id"]
            )

        instance.save()

        return instance


# ============================================================
# PATIENT SERIALIZER
# Used by Admin to view patients.
# ============================================================

class PatientSerializer(
    serializers.ModelSerializer
):

    class Meta:
        model = User

        fields = [
            "id",
            "username",
            "first_name",
            "last_name",
            "email",
            "phone",
            "role",
            "is_active",
            "date_joined",
        ]

        read_only_fields = [
            "id",
            "username",
            "role",
            "is_active",
            "date_joined",
        ]
# =========================================================
# CHANGE PASSWORD SERIALIZER
# =========================================================

class ChangePasswordSerializer(
    serializers.Serializer
):

    current_password = (
        serializers.CharField(
            write_only=True,
        )
    )

    new_password = (
        serializers.CharField(
            write_only=True,
            min_length=8,
        )
    )

    confirm_password = (
        serializers.CharField(
            write_only=True,
            min_length=8,
        )
    )


    def validate(self, attrs):

        if (
            attrs["new_password"] !=
            attrs["confirm_password"]
        ):

            raise serializers.ValidationError(
                {
                    "confirm_password":
                        "Passwords do not match."
                }
            )


        if (
            attrs["current_password"] ==
            attrs["new_password"]
        ):

            raise serializers.ValidationError(
                {
                    "new_password":
                        "New password must be different from current password."
                }
            )


        return attrs        