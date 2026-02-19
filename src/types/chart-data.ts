export type DataScale =
  | 10000
  | 50000
  | 100000
  | 500000
  | 1000000
  | 2000000
  | 5000000
  | 10000000;

export interface ComplexRecordIdentity {
  recordId: string;
  tenantId: string;
  partition: number;
  traceId: string;
  version: number;
}

export interface ComplexRecordActor {
  user: {
    userId: string;
    accountTier: "free" | "team" | "enterprise";
    locale: string;
    tags: string[];
  };
  session: {
    sessionId: string;
    startedAt: string;
    sequence: number;
    retryCount: number;
  };
  device: {
    os: "ios" | "android" | "web";
    osVersion: string;
    appVersion: string;
    model: string;
    network: "wifi" | "lte" | "5g";
  };
  geo: {
    country: string;
    region: string;
    lat: number;
    lng: number;
    timezone: string;
  };
}

export interface ComplexRecordCommerce {
  order: {
    orderId: string;
    currency: "USD" | "KRW" | "JPY";
    items: {
      sku: string;
      category: string;
      quantity: number;
      unitPrice: number;
      discountRate: number;
    }[];
    couponCodes: string[];
    totals: {
      subtotal: number;
      discountTotal: number;
      taxTotal: number;
      shippingTotal: number;
      grandTotal: number;
    };
  };
  payment: {
    method: "card" | "wallet" | "bank";
    gateway: "stripe" | "adyen" | "inhouse";
    installments: number;
    auth: {
      approved: boolean;
      score: number;
      reasonCodes: string[];
    };
  };
  fulfillment: {
    channel: "standard" | "express" | "pickup";
    warehouseId: string;
    etaMinutes: number;
    checkpoints: {
      step: "packed" | "shipped" | "arrived";
      atOffsetMinutes: number;
      success: boolean;
    }[];
  };
}

export interface ComplexRecordTelemetry {
  features: {
    flags: Record<string, boolean>;
    counters: {
      name: string;
      value: number;
      trend: number;
    }[];
  };
  embeddings: number[];
  checkpoints: {
    stage: "ingest" | "enrich" | "aggregate" | "publish";
    atOffsetMs: number;
    state: "ok" | "warn" | "retry";
  }[];
  timings: {
    ingestMs: number;
    normalizeMs: number;
    scoreMs: number;
    publishMs: number;
  };
}

export interface ComplexRecordQuality {
  anomaly: {
    score: number;
    level: "normal" | "elevated" | "critical";
    signals: {
      name: string;
      value: number;
      threshold: number;
    }[];
  };
  scoring: {
    raw: number;
    normalized: number;
    band: "low" | "medium" | "high";
  };
  tags: string[];
}

export interface ComplexRecordMetric {
  value: number;
  bucketIndex: number;
  bucketLabel: string;
  eventAt: string;
  derived: {
    movingAverage: number;
    percentileHint: number;
    confidence: number;
  };
}

export interface ComplexMockRecord {
  identity: ComplexRecordIdentity;
  actor: ComplexRecordActor;
  commerce: ComplexRecordCommerce;
  telemetry: ComplexRecordTelemetry;
  quality: ComplexRecordQuality;
  metric: ComplexRecordMetric;
}

export interface DatasetPipelineMetrics {
  mode: "full-materialized" | "sampled-stream";
  processedRecordCount: number;
  retainedRecordCount: number;
  retentionRatio: number;
  sampleExpansionFactor: number;
  estimatedRecordBytes: number;
  estimatedScaleFootprintMb: number;
  checksum: number;
  timings: {
    recordBuildMs: number;
    aggregationMs: number;
    totalMs: number;
  };
}

export interface HistogramDataset {
  scale: DataScale;
  bucketCount: number;
  labels: string[];
  counts: number[];
  records: ComplexMockRecord[];
  pipeline: DatasetPipelineMetrics;
  min: number;
  max: number;
  average: number;
  seed: number;
  generatedAt: string;
  generationMs: number;
  sampleSize: number;
  isApproximate: boolean;
}

export type ChartLibrary = "echarts" | "chartjs";
export type ChartKind = "bar" | "line";
