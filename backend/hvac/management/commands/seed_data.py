import random
from datetime import datetime, timedelta

from django.core.management.base import BaseCommand
from django.db import DatabaseError, connection
from django.db.models import Max, Min
from django.utils import timezone

from hvac.models import AIDecision, Machine, SensorReading


class Command(BaseCommand):
    help = "Seed initial machine and time-series sample data"

    def add_arguments(self, parser):
        parser.add_argument("--force", action="store_true", help="Clear existing data and regenerate")

    def handle(self, *args, **options):
        force = options.get("force", False)

        now_anchor = timezone.now().replace(minute=0, second=0, microsecond=0)
        seed_year = now_anchor.year
        start_time = timezone.make_aware(datetime(seed_year, 2, 1, 0, 0, 0))
        end_time = timezone.make_aware(datetime(seed_year, 5, 1, 0, 0, 0))
        expected_last_point = end_time - timedelta(minutes=5)

        if force:
            SensorReading.objects.all().delete()
            AIDecision.objects.all().delete()
            Machine.objects.all().delete()

        if not force and Machine.objects.exists() and SensorReading.objects.exists() and AIDecision.objects.exists():
            ts_bounds = SensorReading.objects.aggregate(min_ts=Min("timestamp"), max_ts=Max("timestamp"))
            has_expected_window = (
                ts_bounds["min_ts"] is not None
                and ts_bounds["max_ts"] is not None
                and ts_bounds["min_ts"] <= start_time
                and ts_bounds["max_ts"] >= expected_last_point
            )

            if has_expected_window:
                self.stdout.write(self.style.SUCCESS("Seed skipped: expected Feb-Apr dataset already exists"))
                return

            self.stdout.write(
                self.style.WARNING(
                    "Existing dataset does not match Feb-Apr window; regenerating seed data automatically"
                )
            )
            SensorReading.objects.all().delete()
            AIDecision.objects.all().delete()
            Machine.objects.all().delete()

        machines = [
            Machine(name="AC-L1", machine_type="ac_large", zone="Zone A", rated_power_kw=45),
            Machine(name="AC-L2", machine_type="ac_large", zone="Zone B", rated_power_kw=45),
            Machine(name="AC-L3", machine_type="ac_large", zone="Zone C", rated_power_kw=45),
            Machine(name="AC-S1", machine_type="ac_small", zone="Floor 1", rated_power_kw=12),
            Machine(name="AC-S2", machine_type="ac_small", zone="Floor 2", rated_power_kw=12),
            Machine(name="AC-S3", machine_type="ac_small", zone="Floor 3", rated_power_kw=12),
            Machine(name="AC-S4", machine_type="ac_small", zone="Floor 4", rated_power_kw=12),
            Machine(name="AC-S5", machine_type="ac_small", zone="Server Room", rated_power_kw=12),
            Machine(name="FAN-01", machine_type="fan", zone="Core", rated_power_kw=5),
            Machine(name="FAN-02", machine_type="fan", zone="Core", rated_power_kw=5),
            Machine(name="FAN-03", machine_type="fan", zone="Core", rated_power_kw=5),
            Machine(name="FAN-04", machine_type="fan", zone="Core", rated_power_kw=5),
        ]
        if not Machine.objects.exists():
            Machine.objects.bulk_create(machines)
        machines = list(Machine.objects.all())

        with connection.cursor() as cursor:
            cursor.execute("CREATE EXTENSION IF NOT EXISTS timescaledb;")
            try:
                cursor.execute(
                    "SELECT create_hypertable('hvac_sensorreading', 'timestamp', if_not_exists => TRUE, migrate_data => TRUE);"
                )
            except DatabaseError:
                self.stdout.write(
                    self.style.WARNING(
                        "Hypertable conversion skipped due to table primary-key constraints; continuing with Timescale extension enabled."
                    )
                )

        rng = random.Random(20260311)

        ai_cutover_date = now_anchor.date() - timedelta(days=4)
        always_on = {"AC-S5", "FAN-01"}
        batch = []
        batch_size = 4000

        if SensorReading.objects.exists():
            SensorReading.objects.all().delete()
        ts = start_time
        while ts < end_time:
            hour = ts.hour
            is_ai_period = ts.date() >= ai_cutover_date

            for m in machines:
                is_on = 6 <= hour < 22
                if m.name in always_on and (hour < 6 or hour >= 22):
                    is_on = True

                if is_ai_period:
                    if m.machine_type == "ac_small" and hour in (14, 15) and m.name in {"AC-S2", "AC-S3", "AC-S4"}:
                        is_on = False
                    if m.machine_type == "ac_small" and hour >= 18 and m.name in {"AC-S1", "AC-S2", "AC-S4"}:
                        is_on = False

                baseline_factor = 0.82 if m.machine_type != "fan" else 0.70
                if is_ai_period:
                    baseline_factor *= 0.68
                if not is_on:
                    baseline_factor = 0.0

                jitter = rng.uniform(-0.06, 0.06)
                factor = max(0.0, baseline_factor + jitter)

                temp = None
                setpoint = None
                speed = None
                if "ac" in m.machine_type and is_on:
                    setpoint = 25.0 if not is_ai_period else 24.5 + (0.2 if hour >= 17 else -0.2)
                    temp = setpoint + rng.uniform(-0.7, 0.9)
                if m.machine_type == "fan" and is_on:
                    speed = 60 + rng.uniform(-10, 12)

                batch.append(
                    SensorReading(
                        machine=m,
                        timestamp=ts,
                        power_kw=round(m.rated_power_kw * factor, 2),
                        temperature_c=round(temp, 2) if temp is not None else None,
                        setpoint_c=round(setpoint, 2) if setpoint is not None else None,
                        speed_percent=round(speed, 2) if speed is not None else None,
                        is_on=is_on,
                    )
                )

                if len(batch) >= batch_size:
                    SensorReading.objects.bulk_create(batch, batch_size=batch_size)
                    batch.clear()
            ts += timedelta(minutes=5)

        if batch:
            SensorReading.objects.bulk_create(batch, batch_size=batch_size)

        decisions = []
        templates = [
            ("TURN_ON", "ON", "Building opening - pre-cool occupied zones"),
            ("TURN_ON", "ON", "Ventilation started for occupancy"),
            ("SET_TEMP", "24.0", "Outdoor temperature rising"),
            ("SET_TEMP", "24.5", "Peak occupancy comfort adjustment"),
            ("TURN_OFF", "OFF", "Meeting area no occupancy detected"),
            ("SET_TEMP", "26.0", "Occupancy dropping in evening"),
            ("TURN_OFF", "OFF", "Office floors closing"),
            ("TURN_OFF", "OFF", "Evening shutdown sequence"),
            ("SET_TEMP", "27.0", "Night mode efficiency"),
        ]
        ai_days = [now_anchor.date() - timedelta(days=offset) for offset in range(4)]
        machine_lookup = {m.name: m for m in machines}
        target_order = [
            "AC-L1",
            "AC-L2",
            "FAN-01",
            "AC-S1",
            "AC-L3",
            "AC-S3",
            "AC-L2",
            "FAN-03",
            "AC-L1",
        ]
        clock_offsets = [6.0, 6.25, 9.5, 12.0, 14.5, 17.0, 18.5, 19.0, 22.0]
        for day in ai_days:
            start = timezone.make_aware(datetime.combine(day, datetime.min.time()))
            daily_count = rng.randint(8, 9)
            for idx in range(daily_count):
                action_type, action_value, reason = templates[idx]
                machine = machine_lookup[target_order[idx]]
                event_ts = start + timedelta(hours=clock_offsets[idx])
                if event_ts > end_time:
                    continue
                decisions.append(
                    AIDecision(
                        machine=machine,
                        timestamp=event_ts,
                        action_type=action_type,
                        action_value=action_value,
                        reason=reason,
                    )
                )
        if AIDecision.objects.exists():
            AIDecision.objects.all().delete()
        AIDecision.objects.bulk_create(decisions)

        self.stdout.write(
            self.style.SUCCESS(
                f"Seed completed for {start_time.date()} to {end_time.date()} (Feb-Mar-Apr window)"
            )
        )
