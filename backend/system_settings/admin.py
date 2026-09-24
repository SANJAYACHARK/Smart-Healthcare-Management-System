from django.contrib import admin
from .models import SystemSetting
@admin.register(SystemSetting)
class SystemSettingAdmin(admin.ModelAdmin):
    readonly_fields=("updated_at","updated_by")
    def has_add_permission(self,request): return not SystemSetting.objects.exists()
    def has_delete_permission(self,request,obj=None): return False
