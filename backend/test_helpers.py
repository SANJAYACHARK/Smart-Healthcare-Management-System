from datetime import time, timedelta
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.utils import timezone
from rest_framework.test import APIClient
from accounts.models import Doctor, Receptionist
from appointments.models import Appointment

User=get_user_model()

class HospitalTestMixin:
    password="StrongTestPass123!"
    def make_user(self,username,role,**extra):
        return User.objects.create_user(username=username,password=self.password,role=role,email=f"{username}@example.test",**extra)
    def make_patient(self,username="patient"):
        return self.make_user(username,User.Role.PATIENT)
    def make_doctor(self,username="doctor"):
        user=self.make_user(username,User.Role.DOCTOR)
        doctor=Doctor.objects.create(user=user,specialization="General Medicine",experience_years=5,qualification="MBBS",consultation_fee=Decimal("500.00"),is_available=True)
        return user,doctor
    def make_receptionist(self,username="receptionist"):
        user=self.make_user(username,User.Role.RECEPTIONIST)
        return user,Receptionist.objects.create(user=user,employee_id=f"EMP-{username}")
    def make_appointment(self,patient,doctor,status=Appointment.Status.PENDING,days=1,hour=10):
        return Appointment.objects.create(patient=patient,doctor=doctor,appointment_date=timezone.localdate()+timedelta(days=days),appointment_time=time(hour,0),reason="Validation test",status=status)
    def auth_client(self,user):
        client=APIClient(); client.force_authenticate(user=user); return client
