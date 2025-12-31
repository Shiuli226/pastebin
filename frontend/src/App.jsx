import { useState } from "react";
import "./App.css";

export default function App() {
  const [content, setContent] = useState("");
  const [ttl, setTtl] = useState("");
  const [maxViews, setMaxViews] = useState("");
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [pasteId, setPasteId] = useState("");
  const [pasteLoading, setPasteLoading] = useState(false);
  const [pasteError, setPasteError] = useState(null);
  const [pasteData, setPasteData] = useState(null);

  const [localRemaining, setLocalRemaining] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [createdId, setCreatedId] = useState(null);
  const [confirmViewId, setConfirmViewId] = useState(null);

  // ✅ Backend base URL (works for local + production)
  const API_BASE_URL = import.meta.env.VITE_API_URL || "";

  function handleViewClick(id) {
    if (!id) return;
    if (confirmViewId === id) {
      setConfirmViewId(null);
      fetchPaste(id);
      return;
    }
    setConfirmViewId(id);
    setTimeout(() => {
      setConfirmViewId((curr) => (curr === id ? null : curr));
    }, 5000);
  }

  async function submit() {
    setError(null);
    setUrl("");
    setLocalRemaining(null);

    if (!content || content.trim() === "") {
      setError("Content is required");
      return;
    }

    const body = { content };
    if (ttl !== "") {
      const n = Number(ttl);
      if (!Number.isInteger(n) || n < 1) {
        setError("TTL must be an integer ≥ 1");
        return;
      }
      body.ttl_seconds = n;
    }
    if (maxViews !== "") {
      const m = Number(maxViews);
      if (!Number.isInteger(m) || m < 1) {
        setError("Max views must be an integer ≥ 1");
        return;
      }
      body.max_views = m;
    }

    setLoading(true);
    try {
      // ✅ UPDATED
      const res = await fetch(`${API_BASE_URL}/paste/api/pastes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          data?.error ||
          data?.message ||
          JSON.stringify(data) ||
          "Failed to create paste";
        setError(msg);
        setLoading(false);
        return;
      }

      let id = data?.id;
      if (!id && data?.url) {
        try {
          const u = new URL(data.url);
          id = u.pathname.split("/").filter(Boolean).pop();
        } catch {
          const parts = String(data.url).split("/").filter(Boolean);
          id = parts[parts.length - 1];
        }
      }

      if (id) {
        const local = `${window.location.origin}/p/${id}`;
        setUrl(local);
        setCreatedId(id);
        if (body.max_views != null) setLocalRemaining(body.max_views);
      } else {
        setUrl(data.url || "");
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  async function fetchPaste(idParam) {
    setPasteError(null);
    setPasteData(null);
    const id = idParam || pasteId;
    if (!id || id.trim() === "") {
      setPasteError("Paste id is required");
      return;
    }

    if (idParam) setPasteId(id);
    setPasteLoading(true);

    try {
      // ✅ UPDATED
      const res = await fetch(
        `${API_BASE_URL}/paste/api/pastes/${encodeURIComponent(id)}`
      );

      if (res.status === 404) {
        const json = await res.json().catch(() => ({}));
        setPasteError(json?.message || "Paste not found or unavailable (404)");
        setLocalRemaining(0);
        setPasteData(null);
        setShowModal(true);
        return;
      }

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setPasteError(json?.message || `Error: ${res.status}`);
        setShowModal(true);
        return;
      }

      const data = await res.json();
      setPasteData(data);
      if (data?.remaining_views != null)
        setLocalRemaining(data.remaining_views);
      setShowModal(true);
    } catch (e) {
      setPasteError(String(e));
      setShowModal(true);
    } finally {
      setPasteLoading(false);
    }
  }

  function copyUrl() {
    if (!url) return;
    navigator.clipboard?.writeText(url).catch(() => {});
  }

  return (
    <div className="app-container">
      {/* UI unchanged */}
    </div>
  );
}
