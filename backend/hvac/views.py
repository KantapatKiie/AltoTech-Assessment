import json
import os
from datetime import datetime, timedelta

from anthropic import Anthropic
from django.db import connection
from django.db.models import OuterRef, Subquery
from django.http import HttpRequest, HttpResponseBadRequest, JsonResponse
from django.utils.decorators import method_decorator
from django.utils import timezone
from django.views import View
from django.views.decorators.csrf import csrf_exempt

from hvac.models import AIDecision, Machine, SensorReading


BUCKET_MAP = {
    "5m": "5 minutes",
    "hour": "1 hour",
    "day": "1 day",
}

METRIC_MAP = {
    "power_kw": "power_kw",
    "temperature_c": "temperature_c",
    "setpoint_c": "setpoint_c",
    "speed_percent": "speed_percent",
}


def _parse_dt(value: str | None, fallback: datetime) -> datetime:
    if not value:
        return fallback
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if timezone.is_naive(parsed):
        return timezone.make_aware(parsed)
    return parsed


def _parse_range(request: HttpRequest):
    now = timezone.now()
    default_from = now - timedelta(hours=24)
    try:
        from_dt = _parse_dt(request.GET.get("from"), default_from)
        to_dt = _parse_dt(request.GET.get("to"), now)
    except ValueError:
        return None, None, HttpResponseBadRequest("Invalid datetime format. Use ISO8601.")

    if from_dt >= to_dt:
        return None, None, HttpResponseBadRequest("Invalid range: 'from' must be before 'to'.")
    return from_dt, to_dt, None


class HealthView(View):
    def get(self, request: HttpRequest):
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
            return JsonResponse({"status": "ok", "service": "backend", "database": "ok"})
        except Exception:
            return JsonResponse(
                {"status": "degraded", "service": "backend", "database": "unavailable"},
                status=503,
            )


class MachineListView(View):
    def get(self, request: HttpRequest):
        latest_reading = SensorReading.objects.filter(machine=OuterRef("pk")).order_by("-timestamp")
        machines = (
            Machine.objects.all()
            .annotate(
                current_power_kw=Subquery(latest_reading.values("power_kw")[:1]),
                current_temperature_c=Subquery(latest_reading.values("temperature_c")[:1]),
                current_setpoint_c=Subquery(latest_reading.values("setpoint_c")[:1]),
                current_speed_percent=Subquery(latest_reading.values("speed_percent")[:1]),
                current_is_on=Subquery(latest_reading.values("is_on")[:1]),
                last_seen=Subquery(latest_reading.values("timestamp")[:1]),
            )
            .order_by("name")
        )
        payload = [
            {
                "id": m.id,
                "name": m.name,
                "machine_type": m.machine_type,
                "zone": m.zone,
                "rated_power_kw": m.rated_power_kw,
                "current": {
                    "power_kw": m.current_power_kw,
                    "temperature_c": m.current_temperature_c,
                    "setpoint_c": m.current_setpoint_c,
                    "speed_percent": m.current_speed_percent,
                    "is_on": m.current_is_on,
                    "timestamp": m.last_seen,
                },
            }
            for m in machines
        ]
        return JsonResponse({"items": payload})


class MachineSensorDataView(View):
    def get(self, request: HttpRequest, machine_id: int):
        if not Machine.objects.filter(id=machine_id).exists():
            return JsonResponse({"detail": "Machine not found"}, status=404)

        metric = request.GET.get("metric", "power_kw")
        if metric not in METRIC_MAP:
            return HttpResponseBadRequest("Invalid metric")

        bucket = request.GET.get("bucket", "5m")
        if bucket not in BUCKET_MAP:
            return HttpResponseBadRequest("Invalid bucket. Use 5m|hour|day")

        from_dt, to_dt, error = _parse_range(request)
        if error:
            return error

        metric_column = METRIC_MAP[metric]
        with connection.cursor() as cursor:
            cursor.execute(
                f"""
                SELECT time_bucket(%s, timestamp) AS bucket_ts,
                       AVG({metric_column}) AS value
                FROM hvac_sensorreading
                WHERE machine_id = %s
                  AND timestamp >= %s
                  AND timestamp < %s
                GROUP BY bucket_ts
                ORDER BY bucket_ts ASC
                """,
                [BUCKET_MAP[bucket], machine_id, from_dt, to_dt],
            )
            rows = cursor.fetchall()

        points = [{"timestamp": row[0], "value": float(row[1]) if row[1] is not None else None} for row in rows]
        return JsonResponse(
            {
                "machine_id": machine_id,
                "metric": metric,
                "bucket": bucket,
                "from": from_dt,
                "to": to_dt,
                "points": points,
            }
        )


class BuildingSummaryView(View):
    def get(self, request: HttpRequest):
        latest_reading = SensorReading.objects.filter(machine=OuterRef("pk")).order_by("-timestamp")
        machines = Machine.objects.annotate(
            current_power_kw=Subquery(latest_reading.values("power_kw")[:1]),
            current_temperature_c=Subquery(latest_reading.values("temperature_c")[:1]),
            current_is_on=Subquery(latest_reading.values("is_on")[:1]),
        )

        total_power = 0.0
        active_machines = 0
        temps = []
        for machine in machines:
            total_power += float(machine.current_power_kw or 0)
            if machine.current_is_on:
                active_machines += 1
            if machine.current_temperature_c is not None:
                temps.append(float(machine.current_temperature_c))

        now = timezone.now()
        start_today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        start_yesterday = start_today - timedelta(days=1)

        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT COALESCE(SUM(power_kw), 0) FROM hvac_sensorreading WHERE timestamp >= %s AND timestamp < %s",
                [start_today, now],
            )
            today_sum = float(cursor.fetchone()[0] or 0)
            cursor.execute(
                "SELECT COALESCE(SUM(power_kw), 0) FROM hvac_sensorreading WHERE timestamp >= %s AND timestamp < %s",
                [start_yesterday, start_today],
            )
            yesterday_sum = float(cursor.fetchone()[0] or 0)

        today_energy_kwh = round(today_sum * (5 / 60), 2)
        yesterday_energy_kwh = round(yesterday_sum * (5 / 60), 2)

        return JsonResponse(
            {
                "total_power_kw": round(total_power, 2),
                "active_machines": active_machines,
                "average_temperature_c": round(sum(temps) / len(temps), 2) if temps else None,
                "today_energy_kwh": today_energy_kwh,
                "yesterday_energy_kwh": yesterday_energy_kwh,
                "is_trending_higher_than_yesterday": today_energy_kwh > yesterday_energy_kwh,
            }
        )


class AIDecisionLogView(View):
    def get(self, request: HttpRequest):
        machine_id = request.GET.get("machine_id")
        from_dt, to_dt, error = _parse_range(request)
        if error:
            return error

        qs = AIDecision.objects.select_related("machine").filter(timestamp__gte=from_dt, timestamp__lt=to_dt)
        if machine_id:
            qs = qs.filter(machine_id=machine_id)
        qs = qs.order_by("-timestamp")[:500]

        items = [
            {
                "id": d.id,
                "timestamp": d.timestamp,
                "machine": {"id": d.machine.id, "name": d.machine.name},
                "action_type": d.action_type,
                "action_value": d.action_value,
                "reason": d.reason,
            }
            for d in qs
        ]
        return JsonResponse({"items": items})


class EnergyComparisonView(View):
    def get(self, request: HttpRequest):
        try:
            before_from = datetime.fromisoformat(request.GET.get("before_from", "").replace("Z", "+00:00"))
            before_to = datetime.fromisoformat(request.GET.get("before_to", "").replace("Z", "+00:00"))
            after_from = datetime.fromisoformat(request.GET.get("after_from", "").replace("Z", "+00:00"))
            after_to = datetime.fromisoformat(request.GET.get("after_to", "").replace("Z", "+00:00"))
        except ValueError:
            return HttpResponseBadRequest("Invalid datetime format for comparison ranges")

        if not (before_from < before_to and after_from < after_to):
            return HttpResponseBadRequest("Invalid range: start must be before end")

        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT COALESCE(SUM(power_kw), 0) FROM hvac_sensorreading WHERE timestamp >= %s AND timestamp < %s",
                [before_from, before_to],
            )
            before_sum = float(cursor.fetchone()[0] or 0)
            cursor.execute(
                "SELECT COALESCE(SUM(power_kw), 0) FROM hvac_sensorreading WHERE timestamp >= %s AND timestamp < %s",
                [after_from, after_to],
            )
            after_sum = float(cursor.fetchone()[0] or 0)

        before_kwh = round(before_sum * (5 / 60), 2)
        after_kwh = round(after_sum * (5 / 60), 2)
        delta_kwh = round(after_kwh - before_kwh, 2)
        savings_percent = round(((before_kwh - after_kwh) / before_kwh) * 100, 2) if before_kwh > 0 else 0

        return JsonResponse(
            {
                "before_kwh": before_kwh,
                "after_kwh": after_kwh,
                "delta_kwh": delta_kwh,
                "savings_percent": savings_percent,
            }
        )


class DailyEnergyView(View):
    def get(self, request: HttpRequest):
        date_str = request.GET.get("date")
        if not date_str:
            return HttpResponseBadRequest("'date' is required (YYYY-MM-DD)")

        try:
            day = datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            return HttpResponseBadRequest("Invalid date format. Use YYYY-MM-DD")

        bucket = request.GET.get("bucket", "hour")
        if bucket not in BUCKET_MAP:
            return HttpResponseBadRequest("Invalid bucket. Use 5m|hour|day")

        from_dt = timezone.make_aware(day)
        to_dt = from_dt + timedelta(days=1)

        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT time_bucket(%s, timestamp) AS bucket_ts,
                       SUM(power_kw) * (5.0 / 60.0) AS energy_kwh
                FROM hvac_sensorreading
                WHERE timestamp >= %s
                  AND timestamp < %s
                GROUP BY bucket_ts
                ORDER BY bucket_ts ASC
                """,
                [BUCKET_MAP[bucket], from_dt, to_dt],
            )
            rows = cursor.fetchall()

        return JsonResponse(
            {
                "date": date_str,
                "bucket": bucket,
                "points": [
                    {"timestamp": row[0], "energy_kwh": round(float(row[1] or 0), 3)} for row in rows
                ],
            }
        )


@method_decorator(csrf_exempt, name="dispatch")
class AIChatView(View):
    def post(self, request: HttpRequest):
        api_key = os.getenv("ANTHROPIC_API_KEY", "")
        if not api_key:
            return JsonResponse({"detail": "ANTHROPIC_API_KEY is not configured"}, status=400)

        try:
            payload = json.loads(request.body.decode("utf-8"))
            prompt = payload.get("prompt", "").strip()
        except json.JSONDecodeError:
            return HttpResponseBadRequest("Invalid JSON payload")

        if not prompt:
            return HttpResponseBadRequest("'prompt' is required")

        now = timezone.now()
        yesterday = now - timedelta(days=1)
        with connection.cursor() as cursor:
            cursor.execute(
                "SELECT COALESCE(SUM(power_kw), 0) FROM hvac_sensorreading WHERE timestamp >= %s AND timestamp < %s",
                [yesterday, now],
            )
            recent_power = float(cursor.fetchone()[0] or 0)

        recent_decisions = list(
            AIDecision.objects.select_related("machine").order_by("-timestamp")[:12].values(
                "timestamp", "action_type", "action_value", "reason", "machine__name"
            )
        )
        context = {
            "recent_24h_energy_kwh": round(recent_power * (5 / 60), 2),
            "recent_decisions": recent_decisions,
        }

        try:
            client = Anthropic(api_key=api_key)
            msg = client.messages.create(
                model="claude-3-5-haiku-latest",
                max_tokens=400,
                temperature=0.2,
                messages=[
                    {
                        "role": "user",
                        "content": (
                            "You are an HVAC operations assistant. Answer briefly in Thai with concrete observations.\n"
                            f"Context: {json.dumps(context, default=str)}\n"
                            f"Question: {prompt}"
                        ),
                    }
                ],
            )
            answer = msg.content[0].text if msg.content else "No response"
            return JsonResponse({"answer": answer, "context": context, "source": "anthropic"})
        except Exception:
            decisions_count = len(recent_decisions)
            fallback = (
                "สรุปจากข้อมูลล่าสุดในระบบ: "
                f"พลังงาน 24 ชั่วโมงล่าสุดประมาณ {context['recent_24h_energy_kwh']} kWh, "
                f"มี AI decisions ล่าสุด {decisions_count} รายการ. "
                "ขณะนี้ไม่สามารถเชื่อมต่อผู้ให้บริการ LLM ภายนอกได้ จึงแสดงผลสรุปจากข้อมูลภายในระบบแทน"
            )
            return JsonResponse({"answer": fallback, "context": context, "source": "fallback"})
