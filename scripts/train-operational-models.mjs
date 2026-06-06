import { createGunzip } from "node:zlib";
import { createReadStream, mkdirSync, readdirSync, writeFileSync, copyFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { createInterface } from "node:readline";

const root = resolve(process.cwd());
const featuresDir = join(root, "ml", "datasets", "features");
const registryDir = join(root, "ml", "models", "registry");
const analyticsDir = join(root, "ml", "analytics");
const backendModelDir = join(root, "apps", "api", "routeiq", "ml", "model_artifacts");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");

const numericFeatures = [
  "priority",
  "distance_km",
  "traffic_level",
  "weather_severity",
  "road_complexity",
  "rider_workload",
  "delivery_density",
  "hour_of_day",
  "day_of_week",
  "predicted_eta_min",
  "promised_eta_min",
  "rider_avg_speed_kmph",
  "rider_idle_ratio",
  "rider_completion_rate",
  "area_delay_rate",
  "area_avg_traffic_level"
];
const categoricalFeatures = ["vehicle_type", "area"];

mkdirSync(registryDir, { recursive: true });
mkdirSync(analyticsDir, { recursive: true });
mkdirSync(backendModelDir, { recursive: true });

function listFeatureFiles() {
  return readdirSync(featuresDir)
    .filter((file) => file.startsWith("operational_features_") && file.endsWith(".jsonl.gz"))
    .map((file) => join(featuresDir, file));
}

async function* readJsonlGzip(path) {
  const lineReader = createInterface({
    input: createReadStream(path).pipe(createGunzip()),
    crlfDelay: Infinity
  });
  for await (const line of lineReader) {
    if (line.trim()) yield JSON.parse(line);
  }
}

async function loadFeatures() {
  const rows = [];
  for (const file of listFeatureFiles()) {
    for await (const row of readJsonlGzip(file)) {
      if (Number.isFinite(row.actual_eta_min) && Number.isFinite(row.delayed)) {
        rows.push(row);
      }
    }
  }
  return rows;
}

function encodeCategories(rows) {
  const categories = {};
  for (const feature of categoricalFeatures) {
    categories[feature] = [...new Set(rows.map((row) => row[feature] ?? "unknown"))].sort();
  }
  return categories;
}

function vectorize(row, categories) {
  const values = numericFeatures.map((feature) => Number(row[feature] ?? 0));
  for (const feature of categoricalFeatures) {
    for (const category of categories[feature]) {
      values.push((row[feature] ?? "unknown") === category ? 1 : 0);
    }
  }
  return values;
}

function splitRows(rows) {
  const sorted = [...rows].sort((a, b) => String(a.order_id).localeCompare(String(b.order_id)));
  const testStart = Math.floor(sorted.length * 0.8);
  return { train: sorted.slice(0, testStart), test: sorted.slice(testStart) };
}

function standardize(matrix) {
  const cols = matrix[0].length;
  const means = Array(cols).fill(0);
  const stds = Array(cols).fill(0);
  for (const row of matrix) row.forEach((value, index) => { means[index] += value; });
  for (let index = 0; index < cols; index += 1) means[index] /= matrix.length;
  for (const row of matrix) row.forEach((value, index) => { stds[index] += (value - means[index]) ** 2; });
  for (let index = 0; index < cols; index += 1) stds[index] = Math.sqrt(stds[index] / matrix.length) || 1;
  return {
    means,
    stds,
    transform: (row) => row.map((value, index) => (value - means[index]) / stds[index])
  };
}

function trainLinearRegression(x, y, epochs = 900, lr = 0.025, l2 = 0.001) {
  const weights = Array(x[0].length).fill(0);
  let bias = y.reduce((sum, value) => sum + value, 0) / y.length;
  for (let epoch = 0; epoch < epochs; epoch += 1) {
    const grad = Array(weights.length).fill(0);
    let biasGrad = 0;
    for (let i = 0; i < x.length; i += 1) {
      const prediction = bias + dot(weights, x[i]);
      const error = prediction - y[i];
      biasGrad += error;
      for (let j = 0; j < weights.length; j += 1) grad[j] += error * x[i][j] + l2 * weights[j];
    }
    bias -= lr * biasGrad / x.length;
    for (let j = 0; j < weights.length; j += 1) weights[j] -= lr * grad[j] / x.length;
  }
  return { type: "linear_regression", weights, bias };
}

function trainLogisticRegression(x, y, epochs = 900, lr = 0.035, l2 = 0.001) {
  const weights = Array(x[0].length).fill(0);
  let bias = 0;
  for (let epoch = 0; epoch < epochs; epoch += 1) {
    const grad = Array(weights.length).fill(0);
    let biasGrad = 0;
    for (let i = 0; i < x.length; i += 1) {
      const probability = sigmoid(bias + dot(weights, x[i]));
      const error = probability - y[i];
      biasGrad += error;
      for (let j = 0; j < weights.length; j += 1) grad[j] += error * x[i][j] + l2 * weights[j];
    }
    bias -= lr * biasGrad / x.length;
    for (let j = 0; j < weights.length; j += 1) weights[j] -= lr * grad[j] / x.length;
  }
  return { type: "logistic_regression", weights, bias };
}

function predictLinear(model, x) {
  return model.bias + dot(model.weights, x);
}

function predictLogistic(model, x) {
  return sigmoid(model.bias + dot(model.weights, x));
}

function dot(a, b) {
  return a.reduce((sum, value, index) => sum + value * b[index], 0);
}

function sigmoid(value) {
  return 1 / (1 + Math.exp(-Math.max(-40, Math.min(40, value))));
}

function mae(actual, predicted) {
  return actual.reduce((sum, value, index) => sum + Math.abs(value - predicted[index]), 0) / actual.length;
}

function rmse(actual, predicted) {
  return Math.sqrt(actual.reduce((sum, value, index) => sum + (value - predicted[index]) ** 2, 0) / actual.length);
}

function accuracy(actual, probabilities) {
  let correct = 0;
  for (let index = 0; index < actual.length; index += 1) {
    if ((probabilities[index] >= 0.5 ? 1 : 0) === actual[index]) correct += 1;
  }
  return correct / actual.length;
}

function baselineEta(trainY, testX) {
  const mean = trainY.reduce((sum, value) => sum + value, 0) / trainY.length;
  return testX.map(() => mean);
}

const rows = await loadFeatures();
if (rows.length < 100) {
  throw new Error(`Not enough feature rows to train. Found ${rows.length}. Run collection and preprocessing first.`);
}

const categories = encodeCategories(rows);
const { train, test } = splitRows(rows);
const trainRawX = train.map((row) => vectorize(row, categories));
const scaler = standardize(trainRawX);
const trainX = trainRawX.map(scaler.transform);
const testX = test.map((row) => scaler.transform(vectorize(row, categories)));
const etaTrainY = train.map((row) => Number(row.actual_eta_min));
const etaTestY = test.map((row) => Number(row.actual_eta_min));
const delayTrainY = train.map((row) => Number(row.delayed));
const delayTestY = test.map((row) => Number(row.delayed));

const etaLinear = trainLinearRegression(trainX, etaTrainY);
const etaCandidates = [
  {
    name: "eta_baseline_mean",
    type: "baseline_mean",
    predictions: baselineEta(etaTrainY, testX),
    model: { type: "baseline_mean", value: etaTrainY.reduce((sum, value) => sum + value, 0) / etaTrainY.length }
  },
  {
    name: "eta_linear_operational_v1",
    type: "linear_regression",
    predictions: testX.map((row) => predictLinear(etaLinear, row)),
    model: etaLinear
  }
].map((candidate) => ({
  ...candidate,
  metrics: {
    mae_minutes: Number(mae(etaTestY, candidate.predictions).toFixed(4)),
    rmse_minutes: Number(rmse(etaTestY, candidate.predictions).toFixed(4))
  }
}));

etaCandidates.sort((a, b) => a.metrics.mae_minutes - b.metrics.mae_minutes);
const selectedEta = etaCandidates[0];

const delayLogistic = trainLogisticRegression(trainX, delayTrainY);
const delayCandidates = [
  {
    name: "delay_rule_threshold_v1",
    type: "rule_threshold",
    probabilities: test.map((row) => Math.min(0.98, Math.max(0.02, row.traffic_level * 0.45 + row.area_delay_rate * 0.35 + row.rider_workload * 0.035))),
    model: { type: "rule_threshold" }
  },
  {
    name: "delay_logistic_operational_v1",
    type: "logistic_regression",
    probabilities: testX.map((row) => predictLogistic(delayLogistic, row)),
    model: delayLogistic
  }
].map((candidate) => ({
  ...candidate,
  metrics: {
    accuracy: Number(accuracy(delayTestY, candidate.probabilities).toFixed(4))
  }
}));

delayCandidates.sort((a, b) => b.metrics.accuracy - a.metrics.accuracy);
const selectedDelay = delayCandidates[0];

const artifact = {
  model_family: "rovik_operational_intelligence",
  version: `local_${stamp}`,
  generated_at: new Date().toISOString(),
  training_rows: train.length,
  test_rows: test.length,
  features: {
    numeric: numericFeatures,
    categorical: categoricalFeatures,
    categories,
    scaler: { means: scaler.means, stds: scaler.stds }
  },
  selected_models: {
    eta_prediction: {
      name: selectedEta.name,
      type: selectedEta.type,
      metrics: selectedEta.metrics,
      model: selectedEta.model
    },
    delay_prediction: {
      name: selectedDelay.name,
      type: selectedDelay.type,
      metrics: selectedDelay.metrics,
      model: selectedDelay.model
    }
  },
  candidates: {
    eta: etaCandidates.map(({ predictions, ...candidate }) => candidate),
    delay: delayCandidates.map(({ probabilities, ...candidate }) => candidate)
  }
};

const artifactPath = join(registryDir, `selected_operational_model_${stamp}.json`);
const latestPath = join(registryDir, "selected_operational_model_latest.json");
const backendPath = join(backendModelDir, "selected_operational_model.json");
writeFileSync(artifactPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
copyFileSync(artifactPath, latestPath);
copyFileSync(artifactPath, backendPath);

const report = {
  generated_at: artifact.generated_at,
  training_rows: artifact.training_rows,
  test_rows: artifact.test_rows,
  selected_eta_model: selectedEta.name,
  selected_eta_metrics: selectedEta.metrics,
  selected_delay_model: selectedDelay.name,
  selected_delay_metrics: selectedDelay.metrics,
  artifact_path: artifactPath,
  backend_artifact_path: backendPath,
  artifact_size_mb: Number((statSync(artifactPath).size / 1024 / 1024).toFixed(3))
};
const reportPath = join(analyticsDir, `model_training_report_${stamp}.json`);
writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ ...report, report_path: reportPath }, null, 2));
