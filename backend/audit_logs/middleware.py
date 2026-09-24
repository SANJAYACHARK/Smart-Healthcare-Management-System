from .services import write_audit_log


class AuditLogMiddleware:
    """
    Records successful authenticated write requests.

    It intentionally does NOT store request bodies, passwords, JWTs,
    Razorpay signatures, medical notes, uploaded reports, or other
    sensitive payload content.
    """

    MUTATING_METHODS = {"POST", "PUT", "PATCH", "DELETE"}

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        try:
            if (
                request.method in self.MUTATING_METHODS
                and 200 <= response.status_code < 400
                and request.path.startswith("/api/")
                and not request.path.startswith("/api/audit-logs/")
                and getattr(getattr(request, "user", None), "is_authenticated", False)
            ):
                write_audit_log(
                    request=request,
                    response_status=response.status_code,
                )
        except Exception:
            # Auditing must never break the hospital workflow.
            pass

        return response
