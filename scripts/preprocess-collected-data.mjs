import { createGunzip, createGzip } from "node:zlib";
import { createReadStream, createWriteStream, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { createInterface } from "node:readline";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const root = resolve(process.cwd());
const mlRoot = join(root, "ml");
const rawDir = join(mlRoot, "datasets", "raw");
const telemetryDir = join(mlRoot, "telemetry");
const analyticsDir = join(mlRoot, "analytics");
const featuresDir = join(mlRoot, "datasets", "features");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const city = "chennai";

mkdirSync(analyticsDir, { recursive: true });
mkdirSync(featuresDir, { recursive: true });

function listGzipFiles(dir, prefix) {
  return readdirSync(dir)
    .filter((file) => file.startsWith(prefix) && file.endsWith(".jsonl.gz"))
    .map((file) => join(dir, file));
}

async function* readJsonlGzip(path) {
  const lineReader = createInterface({
    input: createReadStream(path).pipe(createGunzip()),
    crlfDelay: Infinity
  });
  for await (const line of lineReader) {
    if (line.trim().length > 0) {
      yield JSON.parse(line);
    }
  }
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

const eventCounts = new Map();
const areaStats = new Map();
const riderTelemetry = new Map();
const riderEvents = new Map();
const featureRows = [];
let eventTotal = 0;
let telemetryTotal = 0;

for (const file of listGzipFiles(rawDir, "operational_events_")) {
  for await (const event of readJsonlGzip(file)) {
    eventTotal += 1;
    eventCounts.set(event.event_type, (eventCounts.get(event.event_type) ?? 0) + 1);
    const payload = event.payload ?? {};
    const area = payload.area ?? "unknown";
    const areaStat = areaStats.get(area) ?? { area, orders: 0, delayed: 0, eta_sum: 0, traffic_sum: 0 };
    areaStat.orders += 1;
    areaStat.delayed += payload.delayed ? 1 : 0;
    areaStat.eta_sum += payload.predicted_eta_min ?? 0;
    areaStat.traffic_sum += payload.traffic_level ?? 0;
    areaStats.set(area, areaStat);

    const rider = payload.rider_id ?? "unknown";
    const riderStat = riderEvents.get(rider) ?? { rider_id: rider, assigned: 0, completed: 0, failed: 0 };
    if (event.event_type === "rider_assigned") riderStat.assigned += 1;
    if (event.event_type === "delivery_completed") riderStat.completed += 1;
    if (event.event_type === "delivery_failed") riderStat.failed += 1;
    riderEvents.set(rider, riderStat);

    if (event.event_type === "order_created" || event.event_type === "ETA_updated") {
      const fallbackActualEta = Math.max(
        3,
        Math.round(
          (payload.predicted_eta_min ?? 0)
          + (payload.traffic_level ?? 0) * 6
          + (payload.road_complexity ?? 0.45) * 3
          + (payload.rider_workload ?? 3) * 0.8
        )
      );
      const actualEta = payload.actual_eta_min ?? fallbackActualEta;
      const promisedEta = payload.promised_eta_min ?? Math.round((payload.predicted_eta_min ?? actualEta) + 12);
      featureRows.push({
        city: event.city,
        order_id: payload.order_id,
        rider_id: payload.rider_id,
        vehicle_type: payload.vehicle_type,
        area,
        priority: payload.priority,
        distance_km: payload.distance_km,
        traffic_level: payload.traffic_level,
        weather_severity: payload.weather_severity ?? 0.08,
        road_complexity: payload.road_complexity ?? 0.45,
        rider_workload: payload.rider_workload ?? 3,
        delivery_density: payload.delivery_density ?? 12,
        hour_of_day: payload.hour_of_day ?? new Date(event.occurred_at).getHours(),
        day_of_week: payload.day_of_week ?? new Date(event.occurred_at).getDay(),
        predicted_eta_min: payload.predicted_eta_min,
        actual_eta_min: actualEta,
        promised_eta_min: promisedEta,
        delayed: (payload.delayed ?? actualEta > promisedEta) ? 1 : 0,
        occurred_at: event.occurred_at
      });
    }
  }
}

for (const file of listGzipFiles(telemetryDir, "rider_telemetry_")) {
  for await (const point of readJsonlGzip(file)) {
    telemetryTotal += 1;
    const current = riderTelemetry.get(point.rider_id) ?? {
      rider_id: point.rider_id,
      vehicle_type: point.vehicle_type,
      points: 0,
      speed_sum: 0,
      idle_points: 0,
      deviation_sum: 0,
      traffic_sum: 0
    };
    current.points += 1;
    current.speed_sum += point.speed_kmph ?? 0;
    current.idle_points += point.state === "idle" ? 1 : 0;
    current.deviation_sum += point.route_deviation_m ?? 0;
    current.traffic_sum += point.traffic_level ?? 0;
    riderTelemetry.set(point.rider_id, current);
  }
}

const riderAggregates = [...riderTelemetry.values()].map((item) => {
  const events = riderEvents.get(item.rider_id) ?? { assigned: 0, completed: 0, failed: 0 };
  return {
    rider_id: item.rider_id,
    vehicle_type: item.vehicle_type,
    telemetry_points: item.points,
    avg_speed_kmph: Number((item.speed_sum / item.points).toFixed(3)),
    idle_ratio: Number((item.idle_points / item.points).toFixed(4)),
    avg_route_deviation_m: Number((item.deviation_sum / item.points).toFixed(3)),
    avg_traffic_level: Number((item.traffic_sum / item.points).toFixed(4)),
    assigned_orders: events.assigned,
    completed_orders: events.completed,
    failed_orders: events.failed,
    completion_rate: Number((events.completed / Math.max(1, events.completed + events.failed)).toFixed(4))
  };
});

const areaAggregates = [...areaStats.values()].map((item) => ({
  area: item.area,
  orders: item.orders,
  delay_rate: Number((item.delayed / Math.max(1, item.orders)).toFixed(4)),
  avg_eta_min: Number((item.eta_sum / Math.max(1, item.orders)).toFixed(3)),
  avg_traffic_level: Number((item.traffic_sum / Math.max(1, item.orders)).toFixed(4))
}));

const enrichedFeatures = featureRows.map((row) => {
  const rider = riderAggregates.find((item) => item.rider_id === row.rider_id);
  const area = areaAggregates.find((item) => item.area === row.area);
  return {
    ...row,
    rider_avg_speed_kmph: rider?.avg_speed_kmph ?? 0,
    rider_idle_ratio: rider?.idle_ratio ?? 0,
    rider_completion_rate: rider?.completion_rate ?? 0,
    area_delay_rate: area?.delay_rate ?? 0,
    area_avg_traffic_level: area?.avg_traffic_level ?? row.traffic_level
  };
});

const featurePath = join(featuresDir, `operational_features_${city}_${stamp}.jsonl.gz`);
const riderPath = join(analyticsDir, `rider_aggregates_${city}_${stamp}.json`);
const areaPath = join(analyticsDir, `area_aggregates_${city}_${stamp}.json`);
const summaryPath = join(analyticsDir, `preprocessing_summary_${city}_${stamp}.json`);

await writeGzipJsonl(featurePath, enrichedFeatures);
writeFileSync(riderPath, `${JSON.stringify(riderAggregates, null, 2)}\n`, "utf8");
writeFileSync(areaPath, `${JSON.stringify(areaAggregates, null, 2)}\n`, "utf8");

const summary = {
  generated_at: new Date().toISOString(),
  city,
  source_event_files: listGzipFiles(rawDir, "operational_events_").length,
  source_telemetry_files: listGzipFiles(telemetryDir, "rider_telemetry_").length,
  event_total: eventTotal,
  telemetry_total: telemetryTotal,
  feature_rows: enrichedFeatures.length,
  event_counts: Object.fromEntries(eventCounts),
  output_files: {
    features: featurePath,
    rider_aggregates: riderPath,
    area_aggregates: areaPath
  },
  output_sizes_mb: {
    features: Number((statSync(featurePath).size / 1024 / 1024).toFixed(3)),
    rider_aggregates: Number((statSync(riderPath).size / 1024 / 1024).toFixed(3)),
    area_aggregates: Number((statSync(areaPath).size / 1024 / 1024).toFixed(3))
  }
};
writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ ...summary, summary_path: summaryPath }, null, 2));
