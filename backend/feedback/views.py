from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import (
    IsPatientRole,
    IsReceptionistRole,
)

from .models import Feedback
from .serializers import FeedbackSerializer


# ============================================================
# PATIENT - MY FEEDBACK + SUBMIT FEEDBACK
# ============================================================

class PatientFeedbackListCreateView(APIView):

    permission_classes = [
        IsPatientRole
    ]

    # --------------------------------------------------------
    # GET PATIENT FEEDBACK
    # --------------------------------------------------------

    def get(self, request):

        feedback = (
            Feedback.objects
            .select_related(
                "patient",
                "doctor",
                "doctor__user",
                "appointment",
            )
            .filter(
                patient=request.user
            )
            .order_by(
                "-created_at"
            )
        )

        serializer = FeedbackSerializer(
            feedback,
            many=True,
        )

        return Response(
            {
                "count": feedback.count(),
                "results": serializer.data,
            },
            status=status.HTTP_200_OK,
        )


    # --------------------------------------------------------
    # SUBMIT FEEDBACK
    # --------------------------------------------------------

    def post(self, request):

        serializer = FeedbackSerializer(
            data=request.data,
            context={
                "request": request,
            },
        )

        serializer.is_valid(
            raise_exception=True
        )

        feedback = serializer.save()

        return Response(
            {
                "message":
                    "Feedback submitted successfully.",

                "feedback":
                    FeedbackSerializer(
                        feedback
                    ).data,
            },
            status=status.HTTP_201_CREATED,
        )


# ============================================================
# RECEPTIONIST - VIEW ALL FEEDBACK
# ============================================================

class ReceptionistFeedbackListView(APIView):

    permission_classes = [
        IsReceptionistRole
    ]

    def get(self, request):

        feedback = (
            Feedback.objects
            .select_related(
                "patient",
                "doctor",
                "doctor__user",
                "doctor__department",
                "appointment",
            )
            .order_by(
                "-created_at"
            )
        )

        serializer = FeedbackSerializer(
            feedback,
            many=True,
        )

        return Response(
            {
                "count": feedback.count(),
                "results": serializer.data,
            },
            status=status.HTTP_200_OK,
        )