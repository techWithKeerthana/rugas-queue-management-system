import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const colors = ["#3359f4", "#4f46e5", "#10b981", "#f97316", "#f43f5e"];

export default function StatusPieChart({ data }) {
  return (
    <div className="surface-card h-80 p-4">
      <h3 className="heading-display mb-3 text-base font-bold">Status Distribution</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={90} innerRadius={50} paddingAngle={3}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              borderRadius: "0.8rem",
              borderColor: "rgba(148, 163, 184, 0.25)",
              backgroundColor: "rgba(255,255,255,0.96)",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
