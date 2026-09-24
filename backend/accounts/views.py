from datetime import datetime

from django.utils import timezone

from rest_framework import status
from rest_framework.permissions import (
    AllowAny,
    IsAuthenticated,
)
from rest_framework.response import Response
from rest_framework.views import APIView

from appointments.models import Appointment
from departments.models import Department

from .models import (
    User,
    Doctor,
    Receptionist,
)

from .permissions import (
    IsAdminRole,
    IsReceptionistRole,
)

from .serializers import (
    PatientRegistrationSerializer,
    UserProfileSerializer,
    ChangePasswordSerializer,

    DoctorSerializer,
    CreateDoctorSerializer,
    UpdateDoctorSerializer,

    ReceptionistSerializer,
    CreateReceptionistSerializer,
    UpdateReceptionistSerializer,

    PatientSerializer,
)


# ============================================================
# PATIENT REGISTRATION
# ============================================================

class PatientRegistrationView(APIView):

    permission_classes = [
        AllowAny
    ]

    def post(self, request):

        serializer = PatientRegistrationSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = serializer.save()

        return Response(
            {
                "message":
                    "Patient account created successfully.",

                "user": {
                    "id":
                        user.id,

                    "username":
                        user.username,

                    "first_name":
                        user.first_name,

                    "last_name":
                        user.last_name,

                    "email":
                        user.email,

                    "phone":
                        user.phone,

                    "role":
                        user.role,

                    "is_active":
                        user.is_active,
                },
            },
            status=status.HTTP_201_CREATED,
        )


# ============================================================
# CURRENT LOGGED-IN USER PROFILE
# ============================================================

class UserProfileView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def get(self, request):

        serializer = (
            UserProfileSerializer(
                request.user
            )
        )

        return Response(
            serializer.data,
            status=status.HTTP_200_OK,
        )

    def patch(self, request):

        serializer = (
            UserProfileSerializer(
                request.user,
                data=request.data,
                partial=True,
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            {
                "message":
                    "Profile updated successfully.",

                "user":
                    serializer.data,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# ADMIN DASHBOARD STATISTICS
# ============================================================

class AdminDashboardStatsView(APIView):

    permission_classes = [
        IsAdminRole
    ]

    def get(self, request):

        # ----------------------------------------------------
        # USERS
        # ----------------------------------------------------

        total_patients = (
            User.objects.filter(
                role=User.Role.PATIENT
            ).count()
        )

        total_doctors = (
            Doctor.objects.count()
        )

        total_receptionists = (
            Receptionist.objects.count()
        )

        # ----------------------------------------------------
        # DEPARTMENTS
        # ----------------------------------------------------

        total_departments = (
            Department.objects.count()
        )

        active_departments = (
            Department.objects.filter(
                is_active=True
            ).count()
        )

        inactive_departments = (
            Department.objects.filter(
                is_active=False
            ).count()
        )

        # ----------------------------------------------------
        # DOCTOR STATUS
        # ----------------------------------------------------

        active_doctors = (
            Doctor.objects.filter(
                user__is_active=True
            ).count()
        )

        inactive_doctors = (
            Doctor.objects.filter(
                user__is_active=False
            ).count()
        )

        available_doctors = (
            Doctor.objects.filter(
                user__is_active=True,
                is_available=True,
            ).count()
        )

        # ----------------------------------------------------
        # APPOINTMENTS
        # ----------------------------------------------------

        today = timezone.localdate()

        todays_appointments = (
            Appointment.objects
            .filter(
                appointment_date=today
            )
            .exclude(
                status=Appointment.Status.CANCELLED
            )
            .count()
        )

        return Response(
            {
                "total_patients":
                    total_patients,

                "total_doctors":
                    total_doctors,

                "total_receptionists":
                    total_receptionists,

                "total_departments":
                    total_departments,

                "active_doctors":
                    active_doctors,

                "inactive_doctors":
                    inactive_doctors,

                "available_doctors":
                    available_doctors,

                "active_departments":
                    active_departments,

                "inactive_departments":
                    inactive_departments,

                "todays_appointments":
                    todays_appointments,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# ADMIN - DOCTOR LIST + CREATE
# ============================================================

class AdminDoctorListCreateView(APIView):

    permission_classes = [
        IsAdminRole
    ]

    def get(self, request):

        doctors = (
            Doctor.objects
            .select_related(
                "user",
                "department",
            )
            .order_by(
                "-created_at"
            )
        )

        serializer = DoctorSerializer(
            doctors,
            many=True,
        )

        return Response(
            {
                "count":
                    doctors.count(),

                "results":
                    serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):

        serializer = CreateDoctorSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        doctor = serializer.save()

        return Response(
            {
                "message":
                    "Doctor created successfully.",

                "doctor":
                    DoctorSerializer(
                        doctor
                    ).data,
            },
            status=status.HTTP_201_CREATED,
        )


# ============================================================
# ADMIN - DOCTOR DETAIL
# ============================================================

class AdminDoctorDetailView(APIView):

    permission_classes = [
        IsAdminRole
    ]

    def get_doctor(
        self,
        user_id,
    ):

        return (
            Doctor.objects
            .select_related(
                "user",
                "department",
            )
            .filter(
                user__id=user_id
            )
            .first()
        )

    def get(
        self,
        request,
        user_id,
    ):

        doctor = self.get_doctor(
            user_id
        )

        if not doctor:

            return Response(
                {
                    "detail":
                        "Doctor not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            DoctorSerializer(
                doctor
            ).data,
            status=status.HTTP_200_OK,
        )

    def put(
        self,
        request,
        user_id,
    ):

        doctor = self.get_doctor(
            user_id
        )

        if not doctor:

            return Response(
                {
                    "detail":
                        "Doctor not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = UpdateDoctorSerializer(
            doctor,
            data=request.data,
            context={
                "doctor":
                    doctor,
            },
        )

        serializer.is_valid(
            raise_exception=True
        )

        doctor = serializer.save()

        return Response(
            {
                "message":
                    "Doctor updated successfully.",

                "doctor":
                    DoctorSerializer(
                        doctor
                    ).data,
            },
            status=status.HTTP_200_OK,
        )

    def patch(
        self,
        request,
        user_id,
    ):

        doctor = self.get_doctor(
            user_id
        )

        if not doctor:

            return Response(
                {
                    "detail":
                        "Doctor not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        changed = False

        # ----------------------------------------------------
        # ACCOUNT STATUS
        # ----------------------------------------------------

        if "is_active" in request.data:

            is_active = request.data.get(
                "is_active"
            )

            if not isinstance(
                is_active,
                bool,
            ):

                return Response(
                    {
                        "is_active":
                            "This field must be true or false."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            doctor.user.is_active = (
                is_active
            )

            doctor.user.save(
                update_fields=[
                    "is_active"
                ]
            )

            changed = True

        # ----------------------------------------------------
        # DOCTOR AVAILABILITY
        # ----------------------------------------------------

        if "is_available" in request.data:

            is_available = request.data.get(
                "is_available"
            )

            if not isinstance(
                is_available,
                bool,
            ):

                return Response(
                    {
                        "is_available":
                            "This field must be true or false."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            doctor.is_available = (
                is_available
            )

            doctor.save(
                update_fields=[
                    "is_available"
                ]
            )

            changed = True

        if not changed:

            return Response(
                {
                    "detail":
                        "No valid fields were provided."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "message":
                    "Doctor status updated successfully.",

                "doctor":
                    DoctorSerializer(
                        doctor
                    ).data,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# ADMIN - RECEPTIONIST LIST + CREATE
# ============================================================

class AdminReceptionistListCreateView(APIView):

    permission_classes = [
        IsAdminRole
    ]

    def get(self, request):

        receptionists = (
            Receptionist.objects
            .select_related(
                "user"
            )
            .order_by(
                "-created_at"
            )
        )

        serializer = ReceptionistSerializer(
            receptionists,
            many=True,
        )

        return Response(
            {
                "count":
                    receptionists.count(),

                "results":
                    serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def post(self, request):

        serializer = CreateReceptionistSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        receptionist = serializer.save()

        return Response(
            {
                "message":
                    "Receptionist created successfully.",

                "receptionist":
                    ReceptionistSerializer(
                        receptionist
                    ).data,
            },
            status=status.HTTP_201_CREATED,
        )


# ============================================================
# ADMIN - RECEPTIONIST DETAIL
# ============================================================

class AdminReceptionistDetailView(APIView):

    permission_classes = [
        IsAdminRole
    ]

    def get_receptionist(
        self,
        user_id,
    ):

        return (
            Receptionist.objects
            .select_related(
                "user"
            )
            .filter(
                user__id=user_id
            )
            .first()
        )

    def get(
        self,
        request,
        user_id,
    ):

        receptionist = (
            self.get_receptionist(
                user_id
            )
        )

        if not receptionist:

            return Response(
                {
                    "detail":
                        "Receptionist not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            ReceptionistSerializer(
                receptionist
            ).data,
            status=status.HTTP_200_OK,
        )

    def put(
        self,
        request,
        user_id,
    ):

        receptionist = (
            self.get_receptionist(
                user_id
            )
        )

        if not receptionist:

            return Response(
                {
                    "detail":
                        "Receptionist not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = UpdateReceptionistSerializer(
            receptionist,
            data=request.data,
            context={
                "receptionist":
                    receptionist,
            },
        )

        serializer.is_valid(
            raise_exception=True
        )

        receptionist = serializer.save()

        return Response(
            {
                "message":
                    "Receptionist updated successfully.",

                "receptionist":
                    ReceptionistSerializer(
                        receptionist
                    ).data,
            },
            status=status.HTTP_200_OK,
        )

    def patch(
        self,
        request,
        user_id,
    ):

        receptionist = (
            self.get_receptionist(
                user_id
            )
        )

        if not receptionist:

            return Response(
                {
                    "detail":
                        "Receptionist not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if "is_active" not in request.data:

            return Response(
                {
                    "detail":
                        "is_active field is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        is_active = request.data.get(
            "is_active"
        )

        if not isinstance(
            is_active,
            bool,
        ):

            return Response(
                {
                    "is_active":
                        "This field must be true or false."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        receptionist.user.is_active = (
            is_active
        )

        receptionist.user.save(
            update_fields=[
                "is_active"
            ]
        )

        return Response(
            {
                "message":
                    "Receptionist status updated successfully.",

                "receptionist":
                    ReceptionistSerializer(
                        receptionist
                    ).data,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# ADMIN - PATIENTS
# ============================================================

class AdminPatientListView(APIView):

    permission_classes = [
        IsAdminRole
    ]

    def get(self, request):

        patients = (
            User.objects
            .filter(
                role=User.Role.PATIENT
            )
            .order_by(
                "-date_joined"
            )
        )

        serializer = PatientSerializer(
            patients,
            many=True,
        )

        return Response(
            {
                "count":
                    patients.count(),

                "results":
                    serializer.data,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# ADMIN - PATIENT DETAIL
# ============================================================

class AdminPatientDetailView(APIView):

    permission_classes = [
        IsAdminRole
    ]

    def get_patient(
        self,
        user_id,
    ):

        return (
            User.objects
            .filter(
                id=user_id,
                role=User.Role.PATIENT,
            )
            .first()
        )

    def get(
        self,
        request,
        user_id,
    ):

        patient = self.get_patient(
            user_id
        )

        if not patient:

            return Response(
                {
                    "detail":
                        "Patient not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            PatientSerializer(
                patient
            ).data,
            status=status.HTTP_200_OK,
        )

    def patch(
        self,
        request,
        user_id,
    ):

        patient = self.get_patient(
            user_id
        )

        if not patient:

            return Response(
                {
                    "detail":
                        "Patient not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if "is_active" not in request.data:

            return Response(
                {
                    "detail":
                        "is_active field is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        is_active = request.data.get(
            "is_active"
        )

        if not isinstance(
            is_active,
            bool,
        ):

            return Response(
                {
                    "is_active":
                        "This field must be true or false."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        patient.is_active = (
            is_active
        )

        patient.save(
            update_fields=[
                "is_active"
            ]
        )

        return Response(
            {
                "message":
                    "Patient status updated successfully.",

                "patient":
                    PatientSerializer(
                        patient
                    ).data,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# RECEPTIONIST - PATIENT DIRECTORY
# ============================================================

class ReceptionistPatientListView(APIView):

    permission_classes = [
        IsReceptionistRole
    ]

    def get(self, request):

        patients = (
            User.objects
            .filter(
                role=User.Role.PATIENT
            )
            .order_by(
                "first_name",
                "last_name",
                "username",
            )
        )

        serializer = PatientSerializer(
            patients,
            many=True,
        )

        return Response(
            {
                "count":
                    patients.count(),

                "results":
                    serializer.data,
            },
            status=status.HTTP_200_OK,
        )


# ============================================================
# RECEPTIONIST - DOCTOR DIRECTORY + LIVE STATUS
# ============================================================

# ============================================================
# RECEPTIONIST - DOCTOR DIRECTORY + LIVE STATUS
# ============================================================

class ReceptionistDoctorListView(APIView):

    permission_classes = [
        IsReceptionistRole
    ]

    # --------------------------------------------------------
    # PATIENT NAME
    # --------------------------------------------------------

    @staticmethod
    def get_patient_name(patient):

        if not patient:
            return "-"

        # Appointment.patient may be a User or another
        # patient model depending on your project structure.
        if hasattr(patient, "get_full_name"):

            full_name = (
                patient.get_full_name().strip()
            )

            if full_name:
                return full_name

        if hasattr(patient, "user"):

            user = patient.user

            if hasattr(user, "get_full_name"):

                full_name = (
                    user.get_full_name().strip()
                )

                if full_name:
                    return full_name

            return (
                getattr(
                    user,
                    "username",
                    "-"
                )
            )

        return (
            getattr(
                patient,
                "username",
                None
            )
            or
            getattr(
                patient,
                "name",
                None
            )
            or
            str(patient)
        )

    # --------------------------------------------------------
    # APPOINTMENT INFO
    # --------------------------------------------------------

    def appointment_info(
        self,
        appointment,
    ):

        if not appointment:
            return None

        patient = getattr(
            appointment,
            "patient",
            None,
        )

        return {
            "id":
                appointment.id,

            "patient_id":
                getattr(
                    appointment,
                    "patient_id",
                    None,
                ),

            "patient_name":
                self.get_patient_name(
                    patient
                ),

            "appointment_date":
                appointment.appointment_date,

            "appointment_time":
                appointment.appointment_time,

            "status":
                appointment.status,
        }

    # --------------------------------------------------------
    # GET
    # --------------------------------------------------------

    def get(self, request):

        today = timezone.localdate()
        now = timezone.localtime()

        doctors = (
            Doctor.objects
            .select_related(
                "user",
                "department",
            )
            .order_by(
                "user__first_name",
                "user__last_name",
                "user__username",
            )
        )

        results = []

        # ====================================================
        # EACH DOCTOR
        # ====================================================

        for doctor in doctors:

            doctor_data = dict(
                DoctorSerializer(
                    doctor
                ).data
            )

            # =================================================
            # TODAY'S APPOINTMENTS
            #
            # IMPORTANT:
            # Appointment.doctor points to Doctor,
            # NOT doctor.user.
            # =================================================

            appointments = (
                Appointment.objects
                .filter(
                    doctor=doctor,
                    appointment_date=today,
                )
                .select_related(
                    "patient",
                    "doctor",
                )
                .order_by(
                    "appointment_time"
                )
            )

            appointment_list = list(
                appointments
            )

            # =================================================
            # COUNTERS
            # =================================================

            total_today = len(
                appointment_list
            )

            completed_today = 0
            cancelled_today = 0
            active_today = 0

            current_appointment = None
            next_appointment = None

            # =================================================
            # APPOINTMENT PROCESSING
            # =================================================

            for appointment in appointment_list:

                appointment_status = (
                    str(
                        appointment.status
                    ).upper()
                )

                # ---------------------------------------------
                # COMPLETED
                # ---------------------------------------------

                if (
                    appointment_status ==
                    "COMPLETED"
                ):

                    completed_today += 1
                    continue

                # ---------------------------------------------
                # CANCELLED
                # ---------------------------------------------

                if (
                    appointment_status ==
                    "CANCELLED"
                ):

                    cancelled_today += 1
                    continue

                # Everything else is currently active/pending.

                active_today += 1

                # ---------------------------------------------
                # BUILD APPOINTMENT DATETIME
                # ---------------------------------------------

                appointment_datetime = (
                    timezone.make_aware(
                        datetime.combine(
                            appointment.appointment_date,
                            appointment.appointment_time,
                        ),
                        timezone.get_current_timezone(),
                    )
                )

                difference_minutes = (
                    now -
                    appointment_datetime
                ).total_seconds() / 60

                # ---------------------------------------------
                # CURRENT APPOINTMENT
                #
                # Appointment is treated as busy from its
                # scheduled time until 30 minutes afterwards.
                # ---------------------------------------------

                if (
                    current_appointment is None
                    and
                    0 <=
                    difference_minutes
                    <= 30
                ):

                    current_appointment = (
                        appointment
                    )

                    continue

                # ---------------------------------------------
                # NEXT APPOINTMENT
                # ---------------------------------------------

                if (
                    next_appointment is None
                    and
                    appointment_datetime > now
                ):

                    next_appointment = (
                        appointment
                    )

            # =================================================
            # LIVE DOCTOR STATUS
            # =================================================

            if not doctor.user.is_active:

                live_status = "OFFLINE"

            elif not doctor.is_available:

                live_status = "UNAVAILABLE"

            elif current_appointment:

                live_status = "BUSY"

            else:

                live_status = "AVAILABLE"

            # =================================================
            # ATTACH STATUS DATA
            # =================================================

            doctor_data[
                "live_status"
            ] = live_status

            doctor_data[
                "today"
            ] = {
                "total":
                    total_today,

                "active":
                    active_today,

                "completed":
                    completed_today,

                "cancelled":
                    cancelled_today,
            }

            doctor_data[
                "current_appointment"
            ] = (
                self.appointment_info(
                    current_appointment
                )
            )

            doctor_data[
                "next_appointment"
            ] = (
                self.appointment_info(
                    next_appointment
                )
            )

            results.append(
                doctor_data
            )

        # ====================================================
        # SUMMARY
        # ====================================================

        summary = {
            "total":
                len(results),

            "available":
                sum(
                    1
                    for item
                    in results
                    if item.get(
                        "live_status"
                    ) == "AVAILABLE"
                ),

            "busy":
                sum(
                    1
                    for item
                    in results
                    if item.get(
                        "live_status"
                    ) == "BUSY"
                ),

            "unavailable":
                sum(
                    1
                    for item
                    in results
                    if item.get(
                        "live_status"
                    ) == "UNAVAILABLE"
                ),

            "offline":
                sum(
                    1
                    for item
                    in results
                    if item.get(
                        "live_status"
                    ) == "OFFLINE"
                ),
        }

        # ====================================================
        # RESPONSE
        # ====================================================

        return Response(
            {
                "count":
                    len(results),

                "summary":
                    summary,

                "results":
                    results,
            },
            status=status.HTTP_200_OK,
        )
# ============================================================
# CHANGE PASSWORD
# ============================================================

class ChangePasswordView(APIView):

    permission_classes = [
        IsAuthenticated
    ]

    def post(self, request):

        serializer = (
            ChangePasswordSerializer(
                data=request.data
            )
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = request.user

        current_password = (
            serializer.validated_data[
                "current_password"
            ]
        )

        if not user.check_password(
            current_password
        ):

            return Response(
                {
                    "current_password": [
                        "Current password is incorrect."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        new_password = (
            serializer.validated_data[
                "new_password"
            ]
        )

        user.set_password(
            new_password
        )

        user.save(
            update_fields=[
                "password"
            ]
        )

        return Response(
            {
                "message":
                    "Password changed successfully."
            },
            status=status.HTTP_200_OK,
        )