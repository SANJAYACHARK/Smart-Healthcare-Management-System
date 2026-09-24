from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from laboratory.models import LabTestRequest
from test_helpers import HospitalTestMixin

class LaboratoryWorkflowTests(HospitalTestMixin,TestCase):
    def setUp(self):
        self.p=self.make_patient("lp"); self.p2=self.make_patient("lp2"); self.du,self.d=self.make_doctor("ld"); self.ru,_=self.make_receptionist("lr")
    def lab(self,p=None):
        return LabTestRequest.objects.create(patient=p or self.p,doctor=self.d,test_name="CBC",instructions="")
    def test_patient_owner_scoped(self):
        own=self.lab(self.p); self.lab(self.p2)
        res=self.auth_client(self.p).get("/api/laboratory/patient/")
        self.assertEqual(res.status_code,200); self.assertEqual({x["id"] for x in res.data.get("results",[])},{own.id})
    def test_invalid_status_jump_rejected(self):
        lab=self.lab(); res=self.auth_client(self.ru).patch(f"/api/laboratory/receptionist/{lab.id}/",{"status":LabTestRequest.Status.COMPLETED},format="multipart")
        self.assertEqual(res.status_code,400); lab.refresh_from_db(); self.assertEqual(lab.status,LabTestRequest.Status.REQUESTED)
    def test_oversized_report_rejected(self):
        lab=self.lab(); f=SimpleUploadedFile("report.pdf",b"x"*(10*1024*1024+1),content_type="application/pdf")
        res=self.auth_client(self.ru).patch(f"/api/laboratory/receptionist/{lab.id}/",{"report_file":f},format="multipart")
        self.assertEqual(res.status_code,400)
    def test_bad_extension_rejected(self):
        lab=self.lab(); f=SimpleUploadedFile("report.exe",b"x",content_type="application/octet-stream")
        res=self.auth_client(self.ru).patch(f"/api/laboratory/receptionist/{lab.id}/",{"report_file":f},format="multipart")
        self.assertEqual(res.status_code,400)
