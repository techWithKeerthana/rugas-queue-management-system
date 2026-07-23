import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function QueueTrendChart({ data }) {
  return (
    <div className="surface-card h-80 p-4">
      <h3 className="heading-display mb-3 text-base font-bold">Queue Length Trend</h3>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="queueFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3359f4" stopOpacity={0.48} />
              <stop offset="95%" stopColor="#3359f4" stopOpacity={0.06} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.25)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} width={34} />
          <Tooltip
            contentStyle={{
              borderRadius: "0.8rem",
              borderColor: "rgba(148, 163, 184, 0.25)",
              backgroundColor: "rgba(255,255,255,0.96)",
            }}
          />
          <Area type="monotone" dataKey="queueLength" stroke="#2947de" strokeWidth={2.2} fill="url(#queueFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
