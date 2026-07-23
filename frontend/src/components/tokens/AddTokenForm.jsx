import { useState } from "react";

const priorities = [
  { value: "normal", label: "Normal" },
  { value: "senior", label: "Senior Citizen" },
  { value: "vip", label: "VIP" },
  { value: "emergency", label: "Emergency" },
];

export default function AddTokenForm({ onSubmit, disabled }) {
  const [personName, setPersonName] = useState("");
  const [priority, setPriority] = useState("normal");

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!personName.trim()) {
      return;
    }

    await onSubmit({ personName: personName.trim(), priority });
    setPersonName("");
    setPriority("normal");
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_180px_auto]">
      <input
        value={personName}
        onChange={(event) => setPersonName(event.target.value)}
        placeholder="Person name"
        className="w-full rounded-lg border border-slate-300 px-3 py-2 outline-none ring-amber-200 focus:ring"
      />
      <select
        value={priority}
        onChange={(event) => setPriority(event.target.value)}
        className="rounded-lg border border-slate-300 px-3 py-2"
      >
        {priorities.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      <button type="submit" disabled={disabled} className="rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white disabled:opacity-60">
        Add Token
      </button>
    </form>
  );
}
