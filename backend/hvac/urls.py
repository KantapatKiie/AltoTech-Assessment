from django.urls import path

from .views import (
    AIDecisionLogView,
    AIChatView,
    BuildingSummaryView,
    DailyEnergyView,
    EnergyComparisonView,
    HealthView,
    MachineListView,
    MachineSensorDataView,
)

urlpatterns = [
    path("health", HealthView.as_view(), name="health"),
    path("machines", MachineListView.as_view(), name="machine-list"),
    path("machines/<int:machine_id>/sensor-data", MachineSensorDataView.as_view(), name="machine-sensor-data"),
    path("building/summary", BuildingSummaryView.as_view(), name="building-summary"),
    path("ai-decisions", AIDecisionLogView.as_view(), name="ai-decisions"),
    path("energy/comparison", EnergyComparisonView.as_view(), name="energy-comparison"),
    path("energy/daily", DailyEnergyView.as_view(), name="energy-daily"),
    path("ai/chat", AIChatView.as_view(), name="ai-chat"),
]
