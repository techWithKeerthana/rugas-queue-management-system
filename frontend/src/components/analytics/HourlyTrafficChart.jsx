import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function HourlyTrafficChart({ data }) {
  return (
    <div className="surface-card h-80 p-4">
      <h3 className="heading-display mb-3 text-base font-bold">Hourly Peak Traffic</h3>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="4 4" stroke="rgba(148, 163, 184, 0.25)" vertical={false} />
          <XAxis dataKey="hour" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} width={34} />
          <Tooltip
            contentStyle={{
              borderRadius: "0.8rem",
              borderColor: "rgba(148, 163, 184, 0.25)",
              backgroundColor: "rgba(255,255,255,0.96)",
            }}
          />
          <Bar dataKey="count" fill="#4b77ff" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
