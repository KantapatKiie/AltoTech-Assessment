from django.db import models


class Machine(models.Model):
    MACHINE_TYPES = [
        ("ac_large", "Large AC"),
        ("ac_small", "Small AC"),
        ("fan", "Ventilation Fan"),
    ]

    name = models.CharField(max_length=64, unique=True)
    machine_type = models.CharField(max_length=20, choices=MACHINE_TYPES)
    zone = models.CharField(max_length=128)
    rated_power_kw = models.FloatField()

    def __str__(self) -> str:
        return self.name


class SensorReading(models.Model):
    machine = models.ForeignKey(Machine, on_delete=models.CASCADE, related_name="readings")
    timestamp = models.DateTimeField(db_index=True)
    power_kw = models.FloatField(default=0)
    temperature_c = models.FloatField(null=True, blank=True)
    setpoint_c = models.FloatField(null=True, blank=True)
    speed_percent = models.FloatField(null=True, blank=True)
    is_on = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=["machine", "timestamp"]),
            models.Index(fields=["timestamp"]),
        ]


class AIDecision(models.Model):
    machine = models.ForeignKey(Machine, on_delete=models.CASCADE, related_name="ai_decisions")
    timestamp = models.DateTimeField(db_index=True)
    action_type = models.CharField(max_length=32)
    action_value = models.CharField(max_length=64, blank=True, default="")
    reason = models.TextField()

    class Meta:
        indexes = [models.Index(fields=["timestamp"])]
