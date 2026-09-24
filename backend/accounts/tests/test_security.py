from django.test import TestCase
from accounts.models import User
from accounts.permissions import IsAdminRole,IsDoctorRole,IsPatientRole,IsReceptionistRole
from test_helpers import HospitalTestMixin

class AccountRoleValidationTests(HospitalTestMixin,TestCase):
    def test_superuser_is_admin(self):
        u=User.objects.create_superuser(username="root",email="root@example.test",password=self.password)
        self.assertEqual(u.role,User.Role.ADMIN)
    def test_inactive_patient_denied(self):
        u=self.make_patient("inactive"); u.is_active=False; u.save(update_fields=["is_active"])
        req=type("Request",(),{"user":u})()
        self.assertFalse(IsPatientRole().has_permission(req,None))
    def test_role_separation(self):
        p=self.make_patient("p"); d,_=self.make_doctor("d"); r,_=self.make_receptionist("r"); a=self.make_user("a",User.Role.ADMIN)
        cases=[(IsAdminRole(),a,True),(IsAdminRole(),p,False),(IsDoctorRole(),d,True),(IsDoctorRole(),p,False),(IsPatientRole(),p,True),(IsPatientRole(),d,False),(IsReceptionistRole(),r,True),(IsReceptionistRole(),p,False)]
        for perm,user,expected in cases:
            self.assertEqual(perm.has_permission(type("Request",(),{"user":user})(),None),expected)
