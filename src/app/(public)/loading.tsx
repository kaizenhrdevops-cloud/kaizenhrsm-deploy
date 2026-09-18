// Shown instantly while a public route streams in.
// Keeps cold opens feeling fast even when Supabase is waking up.
export default function PublicLoading() {
  return (
    <div className="min-h-screen bg-slate-50 animate-pulse">
      <div className="bg-white border-b border-gray-200 mt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="h-12 w-64 bg-gray-200 rounded-lg mt-8" />
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="h-64 bg-gray-200 rounded-lg mb-12" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-48 bg-gray-200" />
              <div className="p-6 space-y-3">
                <div className="h-6 bg-gray-200 rounded w-3/4" />
                <div className="h-4 bg-gray-100 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
