from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models

class SystemSetting(models.Model):
    class Currency(models.TextChoices):
        INR="INR","Indian Rupee (INR)"
        USD="USD","US Dollar (USD)"
        EUR="EUR","Euro (EUR)"
        GBP="GBP","British Pound (GBP)"

    hospital_name=models.CharField(max_length=180,default="SmartCare Hospital")
    hospital_registration_number=models.CharField(max_length=100,blank=True)
    hospital_address=models.TextField(blank=True)
    hospital_phone=models.CharField(max_length=30,blank=True)
    hospital_email=models.EmailField(blank=True)
    hospital_website=models.URLField(blank=True)

    appointment_slot_minutes=models.PositiveSmallIntegerField(default=30,validators=[MinValueValidator(5),MaxValueValidator(240)])
    advance_booking_days=models.PositiveSmallIntegerField(default=30,validators=[MinValueValidator(1),MaxValueValidator(365)])
    cancellation_cutoff_hours=models.PositiveSmallIntegerField(default=2,validators=[MaxValueValidator(168)])
    working_day_start=models.TimeField(default="09:00")
    working_day_end=models.TimeField(default="18:00")

    queue_enabled=models.BooleanField(default=True)
    queue_token_prefix=models.CharField(max_length=10,default="T")
    queue_start_number=models.PositiveIntegerField(default=1,validators=[MinValueValidator(1),MaxValueValidator(9999)])

    in_app_notifications_enabled=models.BooleanField(default=True)
    appointment_reminders_enabled=models.BooleanField(default=True)
    reminder_24h_enabled=models.BooleanField(default=True)
    reminder_2h_enabled=models.BooleanField(default=True)
    sms_notifications_enabled=models.BooleanField(default=False)
    whatsapp_notifications_enabled=models.BooleanField(default=False)

    lab_max_upload_mb=models.PositiveSmallIntegerField(default=10,validators=[MinValueValidator(1),MaxValueValidator(50)])
    lab_allowed_file_types=models.CharField(max_length=100,default="pdf,jpg,jpeg,png")

    currency=models.CharField(max_length=3,choices=Currency.choices,default=Currency.INR)
    online_payments_enabled=models.BooleanField(default=True)
    offline_payments_enabled=models.BooleanField(default=True)

    hospital_timezone=models.CharField(max_length=64,default="Asia/Kolkata")
    session_timeout_minutes=models.PositiveIntegerField(default=10,validators=[MinValueValidator(5),MaxValueValidator(1440)])
    maintenance_mode=models.BooleanField(default=False)
    maintenance_message=models.CharField(max_length=255,blank=True,default="SmartCare is temporarily under maintenance.")
    updated_at=models.DateTimeField(auto_now=True)
    updated_by=models.ForeignKey("accounts.User",on_delete=models.SET_NULL,null=True,blank=True,related_name="system_setting_updates")

    class Meta:
        verbose_name="System Setting"
        verbose_name_plural="System Settings"

    def clean(self):
        from django.core.exceptions import ValidationError
        errors={}
        if self.working_day_start and self.working_day_end and self.working_day_start>=self.working_day_end:
            errors["working_day_end"]="Working day end must be later than working day start."
        prefix=(self.queue_token_prefix or "").strip().upper()
        if not prefix or not prefix.replace("-","").isalnum():
            errors["queue_token_prefix"]="Use letters, numbers, or a hyphen."
        exts=[x.strip().lower().lstrip(".") for x in (self.lab_allowed_file_types or "").split(",") if x.strip()]
        if set(exts)-{"pdf","jpg","jpeg","png"}:
            errors["lab_allowed_file_types"]="Allowed values: pdf,jpg,jpeg,png."
        if errors: raise ValidationError(errors)

    def save(self,*args,**kwargs):
        self.pk=1
        self.queue_token_prefix=(self.queue_token_prefix or "T").strip().upper()
        self.lab_allowed_file_types=",".join(dict.fromkeys(x.strip().lower().lstrip(".") for x in (self.lab_allowed_file_types or "").split(",") if x.strip())) or "pdf,jpg,jpeg,png"
        self.full_clean()
        return super().save(*args,**kwargs)

    @classmethod
    def load(cls):
        obj,_=cls.objects.get_or_create(pk=1)
        return obj

    def delete(self,*args,**kwargs):
        return None
