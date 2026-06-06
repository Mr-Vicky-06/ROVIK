import { createGzip } from "node:zlib";
import { createWriteStream, mkdirSync, writeFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const root = resolve(process.cwd());
const mlRoot = join(root, "ml");
const rawDir = join(mlRoot, "datasets", "raw");
const telemetryDir = join(mlRoot, "telemetry");
const analyticsDir = join(mlRoot, "analytics");

const now = new Date();
const stamp = now.toISOString().replace(/[:.]/g, "-");
const tenantId = "00000000-0000-0000-0000-000000000001";
const city = "chennai";
const riders = [
  { id: "rider-12", vehicle: "bike", baseLat: 13.0827, baseLng: 80.2707, speed: 22 },
  { id: "rider-07", vehicle: "scooter", baseLat: 13.0358, baseLng: 80.2445, speed: 27 },
  { id: "rider-03", vehicle: "ev_scooter", baseLat: 12.9865, baseLng: 80.2180, speed: 25 },
  { id: "rider-09", vehicle: "van", baseLat: 13.0067, baseLng: 80.2578, speed: 20 }
];
const areas = ["T Nagar", "Velachery", "Anna Nagar", "Adyar", "Guindy", "Mylapore", "OMR"];
const eventTypes = [
  "order_created",
  "rider_assigned",
  "route_generated",
  "ETA_updated",
  "rider_location_updated",
  "delivery_completed",
  "delivery_failed"
];

const eventCount = Number.parseInt(process.argv.find((arg) => arg.startsWith("--events="))?.split("=")[1] ?? "1500", 10);
const telemetryCount = Number.parseInt(process.argv.find((arg) => arg.startsWith("--telemetry="))?.split("=")[1] ?? "5000", 10);

mkdirSync(rawDir, { recursive: true });
mkdirSync(telemetryDir, { recursive: true });
mkdirSync(analyticsDir, { recursive: true });

function jitter(value, amount) {
  return value + (Math.random() - 0.5) * amount;
}

function isoMinutesAgo(minutes) {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function jsonlStream(records) {
  return Readable.from((async function* () {
    for (const record of records) {
      yield `${JSON.stringify(record)}\n`;
    }
  })());
}

async function writeGzipJsonl(path, records) {
  await pipeline(jsonlStream(records), createGzip({ level: 9 }), createWriteStream(path));
}

function* operationalEvents() {
  for (let index = 0; index < eventCount; index += 1) {
    const rider = riders[index % riders.length];
    const eventType = eventTypes[index % eventTypes.length];
    const distanceKm = Number((1.2 + Math.random() * 18).toFixed(2));
    const trafficLevel = Number(Math.random().toFixed(3));
    const weatherSeverity = Number((Math.random() ** 2.8).toFixed(3));
    const roadComplexity = Number(Math.random().toFixed(3));
    const riderWorkload = index % 8;
    const deliveryDensity = Number((4 + Math.random() * 28).toFixed(2));
    const hourOfDay = new Date(Date.now() - (eventCount - index) * 60_000).getHours();
    const rushHourPenalty = [8, 9, 10, 17, 18, 19, 20].includes(hourOfDay) ? 0.78 : 1;
    const effectiveSpeed = Math.max(
      8,
      rider.speed * rushHourPenalty * (1 - trafficLevel * 0.35) * (1 - weatherSeverity * 0.14)
    );
    const predictedEta = Math.round((distanceKm / effectiveSpeed) * 60 + 6 + roadComplexity * 4);
    const actualEta = Math.max(
      3,
      Math.round(
        predictedEta
        + trafficLevel * 7
        + weatherSeverity * 5
        + roadComplexity * 4
        + riderWorkload * 1.15
        + (Math.random() - 0.5) * 7
      )
    );
    const promisedEta = Math.max(8, Math.round(predictedEta + 10 + Math.random() * 14 - riderWorkload * 0.5));
    const delayed = actualEta > promisedEta;
    yield {
      event_id: `evt-${stamp}-${index}`,
      event_type: eventType,
      tenant_id: tenantId,
      city,
      occurred_at: isoMinutesAgo(eventCount - index),
      payload: {
        order_id: `ORD-${1000 + index}`,
        rider_id: rider.id,
        vehicle_type: rider.vehicle,
        area: areas[index % areas.length],
        priority: 1 + (index % 5),
        distance_km: distanceKm,
        traffic_level: trafficLevel,
        weather_severity: weatherSeverity,
        road_complexity: roadComplexity,
        rider_workload: riderWorkload,
        delivery_density: deliveryDensity,
        hour_of_day: hourOfDay,
        day_of_week: new Date().getDay(),
        predicted_eta_min: predictedEta,
        actual_eta_min: actualEta,
        promised_eta_min: promisedEta,
        delayed: delayed,
        source: "local_demo_collector"
      }
    };
  }
}

function* riderTelemetry() {
  for (let index = 0; index < telemetryCount; index += 1) {
    const rider = riders[index % riders.length];
    const traffic = Math.random();
    yield {
      telemetry_id: `tel-${stamp}-${index}`,
      tenant_id: tenantId,
      city,
      rider_id: rider.id,
      vehicle_type: rider.vehicle,
      latitude: Number(jitter(rider.baseLat, 0.08).toFixed(6)),
      longitude: Number(jitter(rider.baseLng, 0.08).toFixed(6)),
      speed_kmph: Number(Math.max(0, rider.speed * (1 - traffic * 0.32) + (Math.random() - 0.5) * 4).toFixed(2)),
      heading_degrees: Math.round(Math.random() * 359),
      traffic_level: Number(traffic.toFixed(3)),
      route_deviation_m: Math.round(Math.random() * 180),
      state: index % 19 === 0 ? "idle" : "active",
      recorded_at: isoMinutesAgo(Math.floor((telemetryCount - index) / 4))
    };
  }
}

const eventPath = join(rawDir, `operational_events_${city}_${stamp}.jsonl.gz`);
const telemetryPath = join(telemetryDir, `rider_telemetry_${city}_${stamp}.jsonl.gz`);
await writeGzipJsonl(eventPath, operationalEvents());
await writeGzipJsonl(telemetryPath, riderTelemetry());

const summary = {
  started_at: now.toISOString(),
  city,
  event_count: eventCount,
  telemetry_count: telemetryCount,
  files: {
    operational_events: eventPath,
    rider_telemetry: telemetryPath
  },
  sizes_mb: {
    operational_events: Number((statSync(eventPath).size / 1024 / 1024).toFixed(3)),
    rider_telemetry: Number((statSync(telemetryPath).size / 1024 / 1024).toFixed(3))
  },
  retention_policy: {
    raw_events_days: 90,
    raw_telemetry_days: 14,
    aggregate_telemetry_days: 365
  }
};
const summaryPath = join(analyticsDir, `collection_summary_${city}_${stamp}.json`);
writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ ...summary, summary_path: summaryPath }, null, 2));
