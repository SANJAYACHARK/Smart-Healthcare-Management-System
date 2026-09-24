from decimal import Decimal
from django.test import TestCase
from billing.models import Bill,Payment
from billing.serializers import BillSerializer
from test_helpers import HospitalTestMixin

class BillingIntegrityTests(HospitalTestMixin,TestCase):
    def setUp(self):
        self.p=self.make_patient("bp"); self.p2=self.make_patient("bp2"); self.ru,_=self.make_receptionist("br")
        self.bill=Bill.objects.create(patient=self.p,description="Consultation",amount=Decimal("1000.00"))
    def test_patient_owner_scoped(self):
        Bill.objects.create(patient=self.p2,description="Private",amount=Decimal("900.00"))
        res=self.auth_client(self.p).get("/api/billing/patient/")
        self.assertEqual(res.status_code,200); self.assertEqual({x["id"] for x in res.data.get("results",[])},{self.bill.id})
    def test_offline_partial_payment(self):
        res=self.auth_client(self.ru).patch(f"/api/billing/receptionist/{self.bill.id}/",{"amount":"400.00"},format="json")
        self.assertEqual(res.status_code,200); pay=Payment.objects.get(bill=self.bill,gateway="OFFLINE"); self.assertEqual(pay.amount,Decimal("400.00")); self.assertEqual(pay.status,Payment.Status.PAID)
        self.bill.refresh_from_db(); self.assertEqual(self.bill.payment_status,Bill.PaymentStatus.PARTIAL)
    def test_overpayment_rejected(self):
        res=self.auth_client(self.ru).patch(f"/api/billing/receptionist/{self.bill.id}/",{"amount":"1000.01"},format="json")
        self.assertEqual(res.status_code,400); self.assertFalse(Payment.objects.filter(bill=self.bill).exists())
    def test_direct_status_mutation_rejected(self):
        res=self.auth_client(self.ru).patch(f"/api/billing/receptionist/{self.bill.id}/",{"payment_status":"PAID"},format="json")
        self.assertEqual(res.status_code,400); self.bill.refresh_from_db(); self.assertEqual(self.bill.payment_status,Bill.PaymentStatus.UNPAID)
    def test_amount_paid_due(self):
        Payment.objects.create(bill=self.bill,patient=self.p,amount=Decimal("250.00"),status=Payment.Status.PAID,gateway="OFFLINE",gateway_order_id="OFFLINE-TEST-1")
        data=BillSerializer(self.bill).data; self.assertEqual(Decimal(data["amount_paid"]),Decimal("250.00")); self.assertEqual(Decimal(data["amount_due"]),Decimal("750.00"))
    def test_other_patient_cannot_view_payments(self):
        res=self.auth_client(self.p2).get(f"/api/billing/patient/{self.bill.id}/payments/")
        self.assertIn(res.status_code,(403,404))
