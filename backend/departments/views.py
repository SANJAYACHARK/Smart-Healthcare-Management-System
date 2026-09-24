from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdminRole

from .models import Department
from .serializers import DepartmentSerializer


# ============================================================
# DEPARTMENT LIST + CREATE
# ============================================================

class DepartmentListCreateView(APIView):

    def get_permissions(self):

        # Patients, Doctors, Receptionists and Admin
        # can VIEW departments.
        if self.request.method == "GET":
            return [
                IsAuthenticated()
            ]

        # Only Admin can CREATE departments.
        return [
            IsAdminRole()
        ]


    # --------------------------------------------------------
    # GET ALL ACTIVE DEPARTMENTS
    # --------------------------------------------------------

    def get(self, request):

        departments = (
            Department.objects
            .filter(
                is_active=True
            )
            .order_by(
                "name"
            )
        )

        serializer = DepartmentSerializer(
            departments,
            many=True,
        )

        return Response(
            {
                "count":
                    departments.count(),

                "results":
                    serializer.data,
            },
            status=status.HTTP_200_OK,
        )


    # --------------------------------------------------------
    # CREATE DEPARTMENT
    # ADMIN ONLY
    # --------------------------------------------------------

    def post(self, request):

        serializer = DepartmentSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        department = serializer.save()

        return Response(
            {
                "message":
                    "Department created successfully.",

                "department":
                    DepartmentSerializer(
                        department
                    ).data,
            },
            status=status.HTTP_201_CREATED,
        )


# ============================================================
# DEPARTMENT DETAIL
# ============================================================

class DepartmentDetailView(APIView):

    def get_permissions(self):

        # Any authenticated user can VIEW
        # one department.
        if self.request.method == "GET":
            return [
                IsAuthenticated()
            ]

        # Admin only for modify/delete.
        return [
            IsAdminRole()
        ]


    # --------------------------------------------------------
    # HELPER
    # --------------------------------------------------------

    def get_department(
        self,
        pk,
    ):

        return (
            Department.objects
            .filter(
                pk=pk
            )
            .first()
        )


    # --------------------------------------------------------
    # GET DEPARTMENT
    # --------------------------------------------------------

    def get(
        self,
        request,
        pk,
    ):

        department = (
            self.get_department(
                pk
            )
        )

        if not department:

            return Response(
                {
                    "detail":
                        "Department not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(
            DepartmentSerializer(
                department
            ).data,
            status=status.HTTP_200_OK,
        )


    # --------------------------------------------------------
    # UPDATE DEPARTMENT
    # ADMIN ONLY
    # --------------------------------------------------------

    def put(
        self,
        request,
        pk,
    ):

        department = (
            self.get_department(
                pk
            )
        )

        if not department:

            return Response(
                {
                    "detail":
                        "Department not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = DepartmentSerializer(
            department,
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True
        )

        serializer.save()

        return Response(
            {
                "message":
                    "Department updated successfully.",

                "department":
                    serializer.data,
            },
            status=status.HTTP_200_OK,
        )


    # --------------------------------------------------------
    # ACTIVATE / DEACTIVATE DEPARTMENT
    # ADMIN ONLY
    # --------------------------------------------------------

    def patch(
        self,
        request,
        pk,
    ):

        department = (
            self.get_department(
                pk
            )
        )

        if not department:

            return Response(
                {
                    "detail":
                        "Department not found."
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


        department.is_active = (
            is_active
        )

        department.save(
            update_fields=[
                "is_active"
            ]
        )


        return Response(
            {
                "message":
                    "Department status updated successfully.",

                "department":
                    DepartmentSerializer(
                        department
                    ).data,
            },
            status=status.HTTP_200_OK,
        )


    # --------------------------------------------------------
    # DELETE DEPARTMENT
    # ADMIN ONLY
    # --------------------------------------------------------

    def delete(
        self,
        request,
        pk,
    ):

        department = (
            self.get_department(
                pk
            )
        )

        if not department:

            return Response(
                {
                    "detail":
                        "Department not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )


        if department.doctors.exists():

            return Response(
                {
                    "detail":
                        "Cannot delete this department because doctors are assigned to it."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )


        department.delete()


        return Response(
            status=status.HTTP_204_NO_CONTENT,
        )