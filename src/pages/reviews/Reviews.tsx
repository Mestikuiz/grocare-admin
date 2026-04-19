import { useEffect, useState } from "react";
import { Star, Eye, EyeOff, Trash2, MessageSquare } from "lucide-react";
import { api } from "../../api/client";
import { useToast } from "../../context/ToastContext";

interface Review {
  id: string;
  rating: number;
  comment?: string;
  isVisible: boolean;
  createdAt: string;
  user: { name?: string; phone: string };
  product: { name: string };
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={12} className={i <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200 fill-gray-200"} />
      ))}
    </div>
  );
}

export default function Reviews() {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<"all" | "visible" | "hidden">("all");
  const limit = 20;

  const load = async (p = page) => {
    setLoading(true);
    try {
      const params: any = { page: p, limit };
      if (filter === "visible") params.isVisible = true;
      if (filter === "hidden")  params.isVisible = false;
      const res = await api.get("/reviews", { params });
      setReviews(res.data.data);
      setTotal(res.data.meta.total);
    } catch { showToast("Failed to load reviews", "error"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(1); setPage(1); }, [filter]);

  const toggleVisibility = async (id: string) => {
    try {
      await api.patch(`/reviews/${id}/visibility`);
      setReviews(prev => prev.map(r => r.id === id ? { ...r, isVisible: !r.isVisible } : r));
      showToast("Visibility updated", "success");
    } catch { showToast("Failed to update", "error"); }
  };

  const deleteReview = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    try {
      await api.delete(`/reviews/${id}`);
      setReviews(prev => prev.filter(r => r.id !== id));
      setTotal(t => t - 1);
      showToast("Review deleted", "success");
    } catch { showToast("Failed to delete", "error"); }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
            <MessageSquare size={20} className="text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Reviews</h1>
            <p className="text-sm text-gray-500">{total} total reviews</p>
          </div>
        </div>
        {/* Filter */}
        <div className="flex gap-2">
          {(["all", "visible", "hidden"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                filter === f
                  ? "bg-[#2382AA] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="divide-y divide-gray-50">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-20 text-center">
            <Star size={36} className="text-gray-200 fill-gray-100 mx-auto mb-3" />
            <p className="text-sm font-medium text-gray-500">No reviews found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 px-6 py-3">Customer</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Product</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Rating</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Comment</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Date</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Status</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-6 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {reviews.map(r => (
                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-800">{r.user.name || "Anonymous"}</p>
                    <p className="text-xs text-gray-400">{r.user.phone}</p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-700 max-w-[160px] truncate">{r.product.name}</p>
                  </td>
                  <td className="px-4 py-4">
                    <StarDisplay rating={r.rating} />
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-600 max-w-[200px] line-clamp-2">
                      {r.comment || <span className="text-gray-300 italic">No comment</span>}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-xs text-gray-500">{formatDate(r.createdAt)}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                      r.isVisible
                        ? "bg-green-50 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}>
                      {r.isVisible ? "Visible" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => toggleVisibility(r.id)}
                        title={r.isVisible ? "Hide" : "Show"}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
                      >
                        {r.isVisible ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                      <button
                        onClick={() => deleteReview(r.id)}
                        title="Delete"
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </p>
            <div className="flex gap-1">
              <button disabled={page === 1} onClick={() => { setPage(p => p - 1); load(page - 1); }}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                Prev
              </button>
              <button disabled={page === totalPages} onClick={() => { setPage(p => p + 1); load(page + 1); }}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
