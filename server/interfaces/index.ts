import { Counter, Gauge, Histogram } from 'prom-client';
import { CounterOpts, GaugeOpts, HistogramOpts } from 'server/services/metrics_service/types';

export interface IMetricsService {
  stringify(): Promise<string>;
  gauge<T extends string>(opts: GaugeOpts<T>): Gauge<T>;
  counter<T extends string>(opts: CounterOpts<T>): Counter<T>;
  histogram<T extends string>(opts: HistogramOpts<T>): Histogram<T>;
}
