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

  function handleViewClick(id) {
    console.log('handleViewClick called', id, { confirmViewId });
    if (!id) return;
    if (confirmViewId === id) {
      setConfirmViewId(null);
      console.log('confirmed view, calling fetchPaste for', id);
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
      const res = await fetch("/paste/api/pastes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = data?.error || data?.message || JSON.stringify(data) || "Failed to create paste";
        setError(msg);
        setLoading(false);
        return;
      }

      let id = data?.id;
      if (!id && data?.url) {
        try {
          const u = new URL(data.url);
          id = u.pathname.split('/').filter(Boolean).pop();
        } catch (e) {
          const parts = String(data.url).split('/').filter(Boolean);
          id = parts[parts.length - 1];
        }
      }

      if (id) {
        const local = `${window.location.origin}/p/${id}`;
        setUrl(local);
        setCreatedId(id);
        if (body.max_views != null) {
          setLocalRemaining(body.max_views);
        }
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
    console.log('fetchPaste called', idParam);
    setPasteError(null);
    setPasteData(null);
    const id = idParam || pasteId;
    if (!id || id.trim() === "") {
      setPasteError("Paste id is required");
      return;
    }

    // If called with an explicit idParam, update the pasteId state so UI shows correct id
    if (idParam) setPasteId(id);

    // NOTE: this GET counts as a view on the server; the UI requires a two-step click to confirm.

    setPasteLoading(true);
    try {
      const res = await fetch(`/paste/api/pastes/${encodeURIComponent(id)}`);
      console.log('fetch response status', res.status);
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
      console.log('fetch data', data);
      setPasteData(data);
      if (data?.remaining_views != null) setLocalRemaining(data.remaining_views);
      setShowModal(true);
    } catch (e) {
      console.error('fetchPaste error', e);
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
      <div className="card">
        <h1 className="title">Pastebin Lite</h1>

        <label className="label">Content <span className="muted">(required)</span></label>
        <textarea
          className="content-input"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={12}
        />

        <div className="form-row">
          <div className="field">
            <label className="label">TTL seconds <span className="muted">(optional)</span></label>
            <input
              className="input"
              type="number"
              min={1}
              value={ttl}
              onChange={(e) => setTtl(e.target.value)}
              placeholder="e.g. 60"
            />
          </div>

          <div className="field">
            <label className="label">Max views <span className="muted">(optional)</span></label>
            <input
              className="input"
              type="number"
              min={1}
              value={maxViews}
              onChange={(e) => setMaxViews(e.target.value)}
              placeholder="e.g. 5"
            />
          </div>
        </div>

        <div className="actions">
          <button className="btn" onClick={submit} disabled={loading}>
            {loading ? "Creating…" : "Create Paste"}
          </button>
        </div>

        {error && (
          <div className="error-box">
            <strong>Error:</strong> {String(error)}
          </div>
        )}

        {url && (
          <div className="url-box">
            <div className="url-label">Paste created:</div>
            <div className="url-row">
              <div style={{display:'flex',alignItems:'center',gap:8}}>
                <button
                  className={`btn-outline ${confirmViewId === createdId ? 'btn-confirm' : ''}`}
                  onClick={() => handleViewClick(createdId)}
                  disabled={!createdId}
                >
                  {confirmViewId === createdId ? 'Confirm view' : 'View paste (modal)'}
                </button>
                <button className="btn-outline" onClick={copyUrl}>Copy URL</button>
              </div>
              {confirmViewId === createdId && (
                <div style={{ marginTop: 6, color: 'var(--muted)', fontSize: 13 }}>
                  Click again to confirm viewing (this will consume a view). Expires in 5s.
                </div>
              )}
             </div>
            <div style={{ marginTop: 8, color: "var(--muted)", fontSize: 13 }}>
              Opening the HTML view will count as a view and may decrement remaining views.
            </div>
            {localRemaining != null && (
              <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                Remaining (local): {localRemaining}
              </div>
            )}
          </div>
        )}

        <div className="divider" />

        {/* New: Open paste by ID */}
        <div style={{ marginTop: 8 }}>
          <label className="label">Open paste by ID</label>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              className="input"
              placeholder="paste id (e.g. 2a55...)"
              value={pasteId}
              onChange={(e) => setPasteId(e.target.value)}
            />
            <button
              className={`btn ${confirmViewId === pasteId ? 'btn-confirm' : ''}`}
              onClick={() => handleViewClick(pasteId)}
              disabled={!pasteId}
            >
              {pasteLoading ? 'Loading…' : (confirmViewId === pasteId ? 'Confirm view' : 'View (consumes view)')}
            </button>
            {confirmViewId === pasteId && (
              <div style={{ marginLeft: 8, color: 'var(--muted)', fontSize: 13 }}>
                Click again to confirm (expires in 5s).
              </div>
            )}
           </div>

          {pasteError && (
            <div className="error-box" style={{ marginTop: 12 }}>
              {pasteError}
            </div>
          )}

          {pasteData && (
            <div className="url-box" style={{ marginTop: 12 }}>
              <div className="url-label">Content</div>
              <pre style={{ whiteSpace: "pre-wrap", margin: 0 }}>{pasteData.content}</pre>
              <div style={{ marginTop: 8, color: "var(--muted)" }}>
                Remaining views: {pasteData.remaining_views === null ? "unlimited" : pasteData.remaining_views}
                {pasteData.expires_at ? ` · Expires at: ${new Date(pasteData.expires_at).toLocaleString()}` : ""}
              </div>
              {localRemaining != null && (
                <div style={{ marginTop: 6, color: "var(--muted)", fontSize: 13 }}>
                  Remaining (local): {localRemaining}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal for viewing paste content */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Close">×</button>
              {pasteData ? (
                <div>
                  <h3 style={{ marginTop: 0 }}>Paste: {pasteId}</h3>
                  <pre style={{ whiteSpace: "pre-wrap", maxHeight: "60vh", overflow: "auto" }}>{pasteData.content}</pre>
                  <div style={{ marginTop: 8, color: "var(--muted)" }}>
                    Remaining views: {pasteData.remaining_views === null ? "unlimited" : pasteData.remaining_views}
                    {pasteData.expires_at ? ` · Expires at: ${new Date(pasteData.expires_at).toLocaleString()}` : ""}
                  </div>
                </div>
              ) : (
                <div className="error-box">{pasteError || "Paste unavailable"}</div>
              )}
            </div>
          </div>
        )}

        <hr className="divider" />

        <div className="tip">
          Tip: The created URL points to <code>/p/:id</code> which shows the paste in a plain HTML view.
        </div>
      </div>
    </div>
  );
}
