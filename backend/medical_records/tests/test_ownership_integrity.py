from django.db import IntegrityError,transaction
from django.test import TestCase
from appointments.models import Appointment
from medical_records.models import MedicalRecord,Prescription,PrescriptionMedicine
from test_helpers import HospitalTestMixin

class MedicalRecordTests(HospitalTestMixin,TestCase):
    def setUp(self):
        self.p=self.make_patient("mp"); self.p2=self.make_patient("mp2"); self.du,self.d=self.make_doctor("md"); self.du2,self.d2=self.make_doctor("md2")
        self.a=self.make_appointment(self.p,self.d,status=Appointment.Status.COMPLETED)
        self.r=MedicalRecord.objects.create(appointment=self.a,patient=self.p,doctor=self.d,symptoms="Fever",diagnosis="Viral fever")
    def test_one_record_per_appointment(self):
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                MedicalRecord.objects.create(appointment=self.a,patient=self.p,doctor=self.d,symptoms="x",diagnosis="x")
    def test_patient_records_owner_scoped(self):
        a2=self.make_appointment(self.p2,self.d2,status=Appointment.Status.COMPLETED,hour=11)
        MedicalRecord.objects.create(appointment=a2,patient=self.p2,doctor=self.d2,symptoms="private",diagnosis="private")
        res=self.auth_client(self.p).get("/api/medical-records/patient/")
        self.assertEqual(res.status_code,200); self.assertEqual({x["id"] for x in res.data.get("results",[])},{self.r.id})
    def test_other_doctor_cannot_complete_consultation(self):
        a=self.make_appointment(self.p,self.d,status=Appointment.Status.IN_CONSULTATION,hour=13)
        payload={"appointment":a.id,"symptoms":"Headache","diagnosis":"Tension headache","clinical_notes":"","follow_up_date":None,"advice":"Rest","medicines":[]}
        res=self.auth_client(self.du2).post("/api/medical-records/doctor/complete-consultation/",payload,format="json")
        self.assertIn(res.status_code,(400,403)); a.refresh_from_db(); self.assertEqual(a.status,Appointment.Status.IN_CONSULTATION); self.assertFalse(MedicalRecord.objects.filter(appointment=a).exists())
    def test_prescription_relations(self):
        p=Prescription.objects.create(medical_record=self.r,patient=self.p,doctor=self.d,advice="After food")
        m=PrescriptionMedicine.objects.create(prescription=p,medicine_name="Paracetamol",dosage="500 mg",frequency="Twice daily",duration="3 days")
        self.assertEqual(p.patient,self.r.patient); self.assertEqual(p.doctor,self.r.doctor); self.assertEqual(m.prescription,p)
