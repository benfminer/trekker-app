// AdminPage — placeholder for Phase 2.
// Will render the protected admin dashboard: submission table with
// edit, delete, and flag actions.

export default function AdminPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1
        className="text-4xl font-bold uppercase tracking-wide text-white sm:text-6xl"
        style={{ fontFamily: "'Oswald', sans-serif" }}
      >
        Admin
      </h1>
      <p className="text-white/50">
        Submission management dashboard — coming in Phase 2.
      </p>
    </div>
  )
}
