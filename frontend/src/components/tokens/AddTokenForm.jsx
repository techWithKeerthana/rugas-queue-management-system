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
    <form onSubmit={handleSubmit} className="surface-card grid gap-3 md:grid-cols-[1fr_180px_auto]">
      <input
        value={personName}
        onChange={(event) => setPersonName(event.target.value)}
        placeholder="Person name"
        className="soft-input"
      />
      <select
        value={priority}
        onChange={(event) => setPriority(event.target.value)}
        className="soft-input"
      >
        {priorities.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
      <button type="submit" disabled={disabled} className="btn-primary">
        Add Token
      </button>
    </form>
  );
}
