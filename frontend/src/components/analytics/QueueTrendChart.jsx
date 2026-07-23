import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function QueueTrendChart({ data }) {
  return (
    <div className="h-72 rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="mb-3 font-semibold text-slate-900">Queue Length Trend</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="queueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.5} />
              <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Area type="monotone" dataKey="queueLength" stroke="#0284c7" fill="url(#queueFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
