import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getQueuesRequest } from "../api/queueApi";
import {
  analyticsHourlyRequest,
  analyticsExportCsvRequest,
  analyticsExportPdfRequest,
  analyticsReportRequest,
  analyticsStatusRequest,
  analyticsSummaryRequest,
  analyticsTrendRequest,
} from "../api/analyticsApi";
import KpiCards from "../components/analytics/KpiCards";
import QueueTrendChart from "../components/analytics/QueueTrendChart";
import StatusPieChart from "../components/analytics/StatusPieChart";
import HourlyTrafficChart from "../components/analytics/HourlyTrafficChart";
import Skeleton from "../components/common/Skeleton";

export default function AnalyticsPage() {
  const [queues, setQueues] = useState([]);
  const [selectedQueueId, setSelectedQueueId] = useState("");
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [trend, setTrend] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [hourlyTraffic, setHourlyTraffic] = useState([]);
  const [period, setPeriod] = useState("daily");
  const [reportRows, setReportRows] = useState([]);

  const downloadBlob = (blob, filename) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const { data } = await getQueuesRequest();
        setQueues(data.queues);
        if (data.queues[0]) {
          setSelectedQueueId(data.queues[0]._id);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load queues");
      }
    };

    bootstrap();
  }, []);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!selectedQueueId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [summaryRes, trendRes, statusRes, hourlyRes] = await Promise.all([
          analyticsSummaryRequest(selectedQueueId),
          analyticsTrendRequest(selectedQueueId),
          analyticsStatusRequest(selectedQueueId),
          analyticsHourlyRequest(selectedQueueId),
        ]);

        setSummary(summaryRes.data.summary);
        setTrend(trendRes.data.trend);
        setStatusDistribution(statusRes.data.statusDistribution);
        setHourlyTraffic(hourlyRes.data.hourlyTraffic);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedQueueId]);

  useEffect(() => {
    const fetchReport = async () => {
      if (!selectedQueueId) {
        return;
      }

      try {
        const { data } = await analyticsReportRequest(selectedQueueId, { period });
        setReportRows(data.rows || []);
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load report");
      }
    };

    fetchReport();
  }, [selectedQueueId, period]);

  const exportCSV = async () => {
    try {
      const { data } = await analyticsExportCsvRequest(selectedQueueId, { period });
      downloadBlob(data, `report-${period}.csv`);
      toast.success("CSV downloaded");
    } catch (error) {
      toast.error(error.response?.data?.message || "CSV export failed");
    }
  };

  const exportPDF = async () => {
    try {
      const { data } = await analyticsExportPdfRequest(selectedQueueId, { period });
      downloadBlob(data, `report-${period}.pdf`);
      toast.success("PDF downloaded");
    } catch (error) {
      toast.error(error.response?.data?.message || "PDF export failed");
    }
  };

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100">Analytics Dashboard</h2>
        <p className="mt-1 text-slate-600 dark:text-slate-400">Live queue performance metrics and trends.</p>
        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_180px_auto_auto]">
          <select
            value={selectedQueueId}
            onChange={(event) => setSelectedQueueId(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            {queues.map((queue) => (
              <option key={queue._id} value={queue._id}>
                {queue.name}
              </option>
            ))}
          </select>

          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>

          <button type="button" onClick={exportCSV} className="rounded-lg bg-emerald-600 px-4 py-2 font-semibold text-white">
            Export CSV
          </button>
          <button type="button" onClick={exportPDF} className="rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white">
            Export PDF
          </button>
        </div>
      </section>

      {loading || !summary ? (
        <div className="grid gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-72" />
          <Skeleton className="h-72" />
        </div>
      ) : (
        <>
          <KpiCards summary={summary} />
          <div className="grid gap-4 lg:grid-cols-2">
            <QueueTrendChart data={trend} />
            <StatusPieChart data={statusDistribution} />
          </div>
          <HourlyTrafficChart data={hourlyTraffic} />

          <section className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-100">{period} report</h3>
            {reportRows.length === 0 ? (
              <p className="text-sm text-slate-600 dark:text-slate-400">No report rows for selected period.</p>
            ) : (
              <div className="overflow-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="py-2">Period Start</th>
                      <th>Total</th>
                      <th>Completed</th>
                      <th>Cancelled</th>
                      <th>Avg Wait (s)</th>
                      <th>Avg Service (s)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportRows.map((row) => (
                      <tr key={row.periodStart} className="border-b border-slate-100 dark:border-slate-800">
                        <td className="py-2">{new Date(row.periodStart).toLocaleString()}</td>
                        <td>{row.totalTokens}</td>
                        <td>{row.completed}</td>
                        <td>{row.cancelled}</td>
                        <td>{row.avgWaitTimeSec}</td>
                        <td>{row.avgServiceTimeSec}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
