from datetime import datetime, time
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from accounts.models import Doctor
from appointments.models import Appointment
from billing.models import Bill
from laboratory.models import LabTestRequest
from .models import MedicalRecord, Prescription

def aware(date_value, time_value=None):
    if not date_value: return None
    if time_value is None: time_value=time.min
    value=datetime.combine(date_value,time_value)
    if timezone.is_naive(value):
        value=timezone.make_aware(value,timezone.get_current_timezone())
    return value

def doctor_name(doctor):
    user=getattr(doctor,"user",None)
    if not user: return ""
    return (user.get_full_name() or "").strip() or user.username

def patient_name(patient):
    return (patient.get_full_name() or "").strip() or patient.username

def item(pk,kind,title,subtitle="",occurred_at=None,status_value="",action_url="",payload=None):
    return {"id":f"{kind}-{pk}","object_id":pk,"type":kind,"title":title,
            "subtitle":subtitle,"occurred_at":occurred_at.isoformat() if occurred_at else None,
            "status":status_value,"action_url":action_url,"payload":payload or {}}

def build_patient_timeline(patient):
    result=[]
    for obj in Appointment.objects.select_related("doctor","doctor__user","doctor__department").filter(patient=patient):
        dn=doctor_name(obj.doctor)
        result.append(item(obj.id,"APPOINTMENT","Appointment",f"Dr. {dn}" if dn else "Doctor appointment",
            aware(obj.appointment_date,obj.appointment_time),obj.status,"/patient/appointments",
            {"doctor_name":dn,"reason":getattr(obj,"reason",""),"appointment_date":str(obj.appointment_date),"appointment_time":str(obj.appointment_time)}))
    for obj in MedicalRecord.objects.select_related("doctor","doctor__user").filter(patient=patient):
        dn=doctor_name(obj.doctor); dt=getattr(obj,"created_at",None) or getattr(obj,"date",None)
        if dt and not isinstance(dt,datetime): dt=aware(dt)
        result.append(item(obj.id,"MEDICAL_RECORD",getattr(obj,"diagnosis","") or "Medical Record",
            f"Dr. {dn}" if dn else "Clinical record",dt,"COMPLETED","/patient/medical-records",
            {"diagnosis":getattr(obj,"diagnosis",""),"symptoms":getattr(obj,"symptoms",""),
             "clinical_notes":getattr(obj,"clinical_notes",""),"advice":getattr(obj,"advice","")}))
    for obj in Prescription.objects.select_related("doctor","doctor__user").filter(patient=patient):
        dn=doctor_name(obj.doctor); dt=getattr(obj,"created_at",None) or getattr(obj,"date",None)
        if dt and not isinstance(dt,datetime): dt=aware(dt)
        result.append(item(obj.id,"PRESCRIPTION","Prescription",f"Dr. {dn}" if dn else "Prescription",
            dt,"ACTIVE","/patient/prescriptions"))
    for obj in LabTestRequest.objects.select_related("doctor","doctor__user").filter(patient=patient):
        dn=doctor_name(obj.doctor)
        result.append(item(obj.id,"LAB_REPORT",getattr(obj,"test_name","") or "Laboratory Test",
            f"Dr. {dn}" if dn else "Laboratory",getattr(obj,"created_at",None),getattr(obj,"status",""),
            "/patient/lab-reports",{"test_name":getattr(obj,"test_name",""),"status":getattr(obj,"status","")}))
    for obj in Bill.objects.filter(patient=patient):
        result.append(item(obj.id,"BILLING",getattr(obj,"invoice_number","") or "Hospital Bill","Billing",
            getattr(obj,"created_at",None),getattr(obj,"payment_status",""),"/patient/billing",
            {"invoice_number":getattr(obj,"invoice_number",""),"amount":str(getattr(obj,"amount","")),
             "payment_status":getattr(obj,"payment_status","")}))
    result.sort(key=lambda x:x["occurred_at"] or "",reverse=True)
    return result

class PatientEHRTimelineView(APIView):
    def get(self,request):
        if getattr(request.user,"role",None)!="PATIENT":
            return Response({"detail":"Patient access required."},status=status.HTTP_403_FORBIDDEN)
        rows=build_patient_timeline(request.user)
        kind=request.query_params.get("type","").strip().upper()
        if kind: rows=[x for x in rows if x["type"]==kind]
        return Response({"patient":{"id":request.user.id,"name":patient_name(request.user)},
                         "total_events":len(rows),"results":rows})

class DoctorPatientEHRTimelineView(APIView):
    def get(self,request,patient_id):
        if getattr(request.user,"role",None)!="DOCTOR":
            return Response({"detail":"Doctor access required."},status=status.HTTP_403_FORBIDDEN)
        try: doctor=request.user.doctor_profile
        except Doctor.DoesNotExist:
            return Response({"detail":"Doctor profile not found."},status=status.HTTP_404_NOT_FOUND)
        appt=Appointment.objects.select_related("patient").filter(doctor=doctor,patient_id=patient_id).first()
        if not appt:
            return Response({"detail":"You do not have access to this patient's EHR."},status=status.HTTP_403_FORBIDDEN)
        patient=appt.patient; rows=build_patient_timeline(patient)
        kind=request.query_params.get("type","").strip().upper()
        if kind: rows=[x for x in rows if x["type"]==kind]
        return Response({"patient":{"id":patient.id,"name":patient_name(patient)},
                         "total_events":len(rows),"results":rows})
