export default function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-2xl bg-gradient-to-r from-slate-200/80 via-slate-100 to-slate-200/80 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 ${className}`} />;
}
