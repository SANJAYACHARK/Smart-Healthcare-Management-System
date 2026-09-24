from django.db import IntegrityError,transaction
from django.test import TestCase
from appointments.models import Appointment
from test_helpers import HospitalTestMixin

class AppointmentIntegrityTests(HospitalTestMixin,TestCase):
    def setUp(self):
        self.p=self.make_patient("ap"); self.p2=self.make_patient("ap2"); self.du,self.d=self.make_doctor("ad"); self.ru,_=self.make_receptionist("ar")
    def test_active_doctor_slot_unique(self):
        a=self.make_appointment(self.p,self.d)
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                Appointment.objects.create(patient=self.p2,doctor=self.d,appointment_date=a.appointment_date,appointment_time=a.appointment_time,status=Appointment.Status.CONFIRMED)
    def test_cancelled_slot_reusable(self):
        a=self.make_appointment(self.p,self.d,status=Appointment.Status.CANCELLED)
        b=Appointment.objects.create(patient=self.p2,doctor=self.d,appointment_date=a.appointment_date,appointment_time=a.appointment_time,status=Appointment.Status.PENDING)
        self.assertIsNotNone(b.pk)
    def test_patient_list_owner_scoped(self):
        own=self.make_appointment(self.p,self.d,hour=10); self.make_appointment(self.p2,self.d,hour=11)
        res=self.auth_client(self.p).get("/api/appointments/patient/")
        self.assertEqual(res.status_code,200); self.assertEqual({x["id"] for x in res.data.get("results",[])},{own.id})
    def test_patient_cannot_cancel_other_patient(self):
        a=self.make_appointment(self.p2,self.d,hour=12)
        res=self.auth_client(self.p).patch(f"/api/appointments/patient/{a.id}/cancel/",{},format="json")
        self.assertIn(res.status_code,(403,404)); a.refresh_from_db(); self.assertEqual(a.status,Appointment.Status.PENDING)
    def test_receptionist_cannot_confirm_pending(self):
        a=self.make_appointment(self.p,self.d)
        res=self.auth_client(self.ru).patch(f"/api/appointments/receptionist/{a.id}/status/",{"status":"CONFIRMED"},format="json")
        self.assertEqual(res.status_code,400); a.refresh_from_db(); self.assertEqual(a.status,Appointment.Status.PENDING)
