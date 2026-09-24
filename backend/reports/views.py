from django.http import HttpResponse

from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsAdminRole

from .services import (
    REPORT_TYPES,
    export_csv,
    export_pdf,
    export_xlsx,
    get_rows,
    parse_date_range,
    summary,
)


# =========================================================
# ADMIN REPORT SUMMARY
# =========================================================

class AdminReportSummaryView(APIView):

    permission_classes = [IsAdminRole]

    def get(self, request):

        try:
            start, end = parse_date_range(
                request.query_params
            )

        except ValueError as exc:
            return Response(
                {
                    "detail": str(exc)
                },
                status=400,
            )

        data = summary(
            start,
            end,
        )

        data["report_types"] = [
            {
                "value": key,
                "label": value,
            }
            for key, value
            in REPORT_TYPES.items()
        ]

        return Response(data)


# =========================================================
# ADMIN REPORT PREVIEW
# =========================================================

class AdminReportPreviewView(APIView):

    permission_classes = [IsAdminRole]

    def get(self, request):

        report_type = request.query_params.get(
            "type",
            "appointments",
        )

        # Validate report type
        if report_type not in REPORT_TYPES:
            return Response(
                {
                    "detail":
                    "Invalid report type."
                },
                status=400,
            )

        try:
            start, end = parse_date_range(
                request.query_params
            )

            rows = get_rows(
                report_type,
                start,
                end,
            )

        except ValueError as exc:
            return Response(
                {
                    "detail": str(exc)
                },
                status=400,
            )

        return Response(
            {
                "type": report_type,
                "label": REPORT_TYPES[
                    report_type
                ],
                "count": len(rows),
                "rows": rows[:100],
            }
        )


# =========================================================
# ADMIN REPORT EXPORT
# =========================================================

class AdminReportExportView(APIView):

    permission_classes = [IsAdminRole]

    def get(self, request):

        report_type = request.query_params.get(
            "type",
            "appointments",
        )

        # IMPORTANT:
        # Do NOT use query parameter "format".
        # DRF reserves "format" for renderer selection.
        fmt = request.query_params.get(
            "export_format",
            "xlsx",
        ).lower()

        # -------------------------------------------------
        # Validate report type
        # -------------------------------------------------

        if report_type not in REPORT_TYPES:
            return Response(
                {
                    "detail":
                    "Invalid report type."
                },
                status=400,
            )

        # -------------------------------------------------
        # Load report data
        # -------------------------------------------------

        try:

            start, end = parse_date_range(
                request.query_params
            )

            rows = get_rows(
                report_type,
                start,
                end,
            )

        except ValueError as exc:

            return Response(
                {
                    "detail": str(exc)
                },
                status=400,
            )

        title = REPORT_TYPES[
            report_type
        ]

        filename = (
            f"smartcare_"
            f"{report_type}_"
            f"{start}_"
            f"{end}"
        )

        # -------------------------------------------------
        # CSV
        # -------------------------------------------------

        if fmt == "csv":

            content = export_csv(
                rows
            )

            mime = (
                "text/csv; "
                "charset=utf-8"
            )

            ext = "csv"

        # -------------------------------------------------
        # EXCEL
        # -------------------------------------------------

        elif fmt == "xlsx":

            try:

                content = export_xlsx(
                    rows,
                    title,
                )

            except ImportError:

                return Response(
                    {
                        "detail":
                        "Install openpyxl "
                        "to export Excel reports."
                    },
                    status=500,
                )

            mime = (
                "application/"
                "vnd.openxmlformats-officedocument."
                "spreadsheetml.sheet"
            )

            ext = "xlsx"

        # -------------------------------------------------
        # PDF
        # -------------------------------------------------

        elif fmt == "pdf":

            try:

                content = export_pdf(
                    rows,
                    title,
                    start,
                    end,
                )

            except ImportError:

                return Response(
                    {
                        "detail":
                        "Install reportlab "
                        "to export PDF reports."
                    },
                    status=500,
                )

            mime = "application/pdf"
            ext = "pdf"

        # -------------------------------------------------
        # INVALID FORMAT
        # -------------------------------------------------

        else:

            return Response(
                {
                    "detail":
                    "export_format must be "
                    "csv, xlsx or pdf."
                },
                status=400,
            )

        # -------------------------------------------------
        # DOWNLOAD RESPONSE
        # -------------------------------------------------

        response = HttpResponse(
            content,
            content_type=mime,
        )

        response[
            "Content-Disposition"
        ] = (
            f'attachment; '
            f'filename="{filename}.{ext}"'
        )

        response[
            "Access-Control-Expose-Headers"
        ] = "Content-Disposition"

        return response