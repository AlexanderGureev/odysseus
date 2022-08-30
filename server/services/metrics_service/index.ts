import client from 'prom-client';

import { Counter, CounterOpts, Gauge, GaugeOpts, Histogram, HistogramOpts } from './types';

export const MetricsService = () => {
  const registry = new client.Registry();
  client.collectDefaultMetrics({ register: registry });

  const gauges: { [key in string]?: Gauge } = {};
  const counters: { [key in string]?: Counter } = {};
  const histograms: { [key in string]?: Histogram } = {};

  const gauge = <T extends string>(opts: GaugeOpts<T>) => {
    if (!gauges[opts.name]) {
      gauges[opts.name] = new client.Gauge<T>({
        ...opts,
        registers: [registry],
      });
    }

    return gauges[opts.name] as Gauge<T>;
  };

  const counter = <T extends string>(opts: CounterOpts<T>) => {
    if (!counters[opts.name]) {
      counters[opts.name] = new client.Counter<T>({
        ...opts,
        registers: [registry],
      });
    }

    return counters[opts.name] as Counter<T>;
  };

  const histogram = <T extends string>(opts: HistogramOpts<T>) => {
    if (!histograms[opts.name]) {
      histograms[opts.name] = new client.Histogram<T>({
        ...opts,
        registers: [registry],
      });
    }

    return histograms[opts.name] as Histogram<T>;
  };

  const collectMemoryUsage = () => {
    const used = process.memoryUsage();
    return Object.keys(used).reduce((acc, key) => {
      const k = key as keyof NodeJS.MemoryUsage;

      gauge({
        name: 'memory_usage',
        help: 'leviathan proccess memory usage (bytes)',
        labelNames: ['stat_name'],
      }).set({ stat_name: k }, used[k]);

      return { ...acc, [key]: `${Math.round((used[k] / 1024 / 1024) * 100) / 100} MB` };
    }, {});
  };

  return {
    gauge,
    counter,
    histogram,
    stringify: async () => {
      collectMemoryUsage();
      const data = await registry.metrics();
      return data;
    },
  };
};
