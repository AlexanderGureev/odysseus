import client from "prom-client";

export type GaugeOpts<T extends string> = client.GaugeConfiguration<T>;
export type Gauge<T extends string = any> = client.Gauge<T>;

export type HistogramOpts<T extends string> = client.HistogramConfiguration<T>;
export type Histogram<T extends string = any> = client.Histogram<T>;

export type CounterOpts<T extends string> = client.CounterConfiguration<T>;
export type Counter<T extends string = any> = client.Counter<T>;
