import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const colors = ["#0ea5e9", "#f59e0b", "#10b981", "#f43f5e"];

export default function StatusPieChart({ data }) {
  return (
    <div className="h-72 rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="mb-3 font-semibold text-slate-900">Status Distribution</h3>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={90}>
            {data.map((entry, index) => (
              <Cell key={entry.name} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Legend />
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
