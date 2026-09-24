from zoneinfo import ZoneInfo, ZoneInfoNotFoundError
from rest_framework import serializers
from .models import SystemSetting

class SystemSettingSerializer(serializers.ModelSerializer):
    updated_by_name=serializers.SerializerMethodField()
    class Meta:
        model=SystemSetting
        fields="__all__"
        read_only_fields=("id","updated_at","updated_by","updated_by_name")
    def get_updated_by_name(self,obj):
        return (obj.updated_by.get_full_name() or obj.updated_by.username) if obj.updated_by else ""
    def validate_hospital_timezone(self,value):
        value=value.strip()
        try: ZoneInfo(value)
        except ZoneInfoNotFoundError: raise serializers.ValidationError("Enter a valid IANA timezone.")
        return value
    def validate_lab_allowed_file_types(self,value):
        exts=[x.strip().lower().lstrip(".") for x in value.split(",") if x.strip()]
        if set(exts)-{"pdf","jpg","jpeg","png"}: raise serializers.ValidationError("Allowed values: pdf,jpg,jpeg,png.")
        return ",".join(dict.fromkeys(exts))
    def validate(self,attrs):
        start=attrs.get("working_day_start",getattr(self.instance,"working_day_start",None))
        end=attrs.get("working_day_end",getattr(self.instance,"working_day_end",None))
        if start and end and start>=end: raise serializers.ValidationError({"working_day_end":"Working day end must be later than start."})
        return attrs

class PublicSystemSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model=SystemSetting
        fields=("hospital_name","hospital_address","hospital_phone","hospital_email","hospital_website","appointment_slot_minutes","advance_booking_days","working_day_start","working_day_end","queue_enabled","queue_token_prefix","currency","online_payments_enabled","offline_payments_enabled","hospital_timezone","maintenance_mode","maintenance_message")
