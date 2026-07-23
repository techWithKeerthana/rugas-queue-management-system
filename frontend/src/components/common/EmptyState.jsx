export default function EmptyState({ title, description, action }) {
  return (
    <div className="surface-card border-dashed px-6 py-12 text-center">
      <h3 className="heading-display text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-muted">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
