import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 2,
  duration: '20s',
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1200'],
  },
};

const BASE = __ENV.BASE_URL || 'http://localhost:8000/api';

export default function () {
  const health = http.get(`${BASE}/health`);
  check(health, {
    'health status is 200': (r) => r.status === 200,
  });

  const machines = http.get(`${BASE}/machines`);
  check(machines, {
    'machines status is 200': (r) => r.status === 200,
  });

  const summary = http.get(`${BASE}/building/summary`);
  check(summary, {
    'summary status is 200': (r) => r.status === 200,
  });

  sleep(1);
}
