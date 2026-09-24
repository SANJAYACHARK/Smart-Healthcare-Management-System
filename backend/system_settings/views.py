from rest_framework.generics import RetrieveAPIView, RetrieveUpdateAPIView
from rest_framework.permissions import AllowAny
from accounts.permissions import IsAdminRole
from .models import SystemSetting
from .serializers import SystemSettingSerializer, PublicSystemSettingSerializer

class AdminSystemSettingView(RetrieveUpdateAPIView):
    serializer_class=SystemSettingSerializer
    permission_classes=[IsAdminRole]
    http_method_names=["get","patch","head","options"]
    def get_object(self): return SystemSetting.load()
    def perform_update(self,serializer): serializer.save(updated_by=self.request.user)

class PublicSystemSettingView(RetrieveAPIView):
    serializer_class=PublicSystemSettingSerializer
    permission_classes=[AllowAny]
    authentication_classes=[]
    def get_object(self): return SystemSetting.load()
