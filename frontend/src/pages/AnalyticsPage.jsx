import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { getQueuesRequest } from "../api/queueApi";
import {
  analyticsHourlyRequest,
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

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-2xl font-black text-slate-900">Analytics Dashboard</h2>
        <p className="mt-1 text-slate-600">Live queue performance metrics and trends.</p>
        <select
          value={selectedQueueId}
          onChange={(event) => setSelectedQueueId(event.target.value)}
          className="mt-4 rounded-lg border border-slate-300 px-3 py-2"
        >
          {queues.map((queue) => (
            <option key={queue._id} value={queue._id}>
              {queue.name}
            </option>
          ))}
        </select>
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
        </>
      )}
    </div>
  );
}
