from django.shortcuts import get_object_or_404
from django.http import JsonResponse
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from accounts.models import Doctor
from .models import Prescription
from .prescription_documents import build_prescription_pdf, prescription_signature, verification_url, verify_prescription_signature

def _allowed(user,prescription):
    role=getattr(user,"role","")
    if role=="PATIENT": return prescription.patient_id==user.id
    if role=="DOCTOR":
        try: return prescription.doctor_id==user.doctor_profile.id
        except Doctor.DoesNotExist: return False
    return role in {"ADMIN","RECEPTIONIST"}

class PrescriptionPDFView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request,prescription_id):
        p=get_object_or_404(Prescription.objects.select_related("patient","doctor","doctor__user","medical_record").prefetch_related("medicines"),id=prescription_id)
        if not _allowed(request.user,p): return Response({"detail":"You do not have access to this prescription."},status=status.HTTP_403_FORBIDDEN)
        return build_prescription_pdf(request,p)

class PrescriptionVerificationInfoView(APIView):
    permission_classes=[IsAuthenticated]
    def get(self,request,prescription_id):
        p=get_object_or_404(Prescription,id=prescription_id)
        if not _allowed(request.user,p): return Response({"detail":"You do not have access to this prescription."},status=status.HTTP_403_FORBIDDEN)
        return Response({"prescription_id":p.id,"reference":f"RX-{p.id:06d}","signature":prescription_signature(p.id),"verification_url":verification_url(request,p)})

def public_verify_prescription(request,prescription_id,signature):
    p=get_object_or_404(Prescription.objects.select_related("patient","doctor","doctor__user"),id=prescription_id)
    if not verify_prescription_signature(p.id,signature): return JsonResponse({"valid":False,"message":"Invalid prescription verification code."},status=400)
    pn=(p.patient.get_full_name() or "").strip() or p.patient.username
    dn=(p.doctor.user.get_full_name() or "").strip() or p.doctor.user.username
    return JsonResponse({"valid":True,"message":"Verified SmartCare prescription.","prescription":{"id":p.id,"reference":f"RX-{p.id:06d}","patient":pn,"doctor":f"Dr. {dn}","issued_at":p.created_at.isoformat()}})
