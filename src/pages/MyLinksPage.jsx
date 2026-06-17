import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TopNav from '../components/TopNav';
import Footer from '../components/Footer';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import useResponsivePageSize from '../hooks/useResponsivePageSize';

const QrStudio = lazy(() => import('../components/QrStudio'));
const QrPreview = lazy(() => import('../components/QrPreview'));
import { createQr, deleteLink, deleteQr, fetchLinkQrs, fetchMyLinks, updateQr } from '../lib/api';
import { useToast } from '../contexts/ToastContext';

function formatDate(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

function stripProtocol(url) {
  return (url || '').replace(/^https?:\/\//, '');
}

export default function MyLinksPage() {
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const pageSize = useResponsivePageSize();
  const [page, setPage] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [qrCache, setQrCache] = useState({});
  const [editor, setEditor] = useState(null);
  const [savingEditor, setSavingEditor] = useState(false);

  const loadQrs = useCallback(async (shortKey) => {
    setQrCache((c) => ({ ...c, [shortKey]: { loading: true, items: [], error: null } }));
    try {
      const items = await fetchLinkQrs(shortKey);
      setQrCache((c) => ({ ...c, [shortKey]: { loading: false, items, error: null } }));
    } catch (err) {
      setQrCache((c) => ({ ...c, [shortKey]: { loading: false, items: [], error: err.message } }));
    }
  }, []);

  const toggleDetails = (shortKey) => {
    setExpanded((cur) => (cur === shortKey ? null : shortKey));
    if (!qrCache[shortKey]) loadQrs(shortKey);
  };

  const saveEditor = async (config) => {
    if (!editor) return;
    setSavingEditor(true);
    try {
      if (editor.qr) await updateQr(editor.qr.qrId, editor.qr.label ?? null, config);
      else await createQr(editor.shortKey, null, config);
      pushToast({ type: 'success', title: editor.qr ? 'QR updated' : 'QR saved' });
      await loadQrs(editor.shortKey);
      setEditor(null);
    } catch (err) {
      pushToast({ type: 'error', title: 'Could not save QR', message: err.message });
    } finally {
      setSavingEditor(false);
    }
  };

  const handleDeleteQr = async (shortKey, qrId) => {
    try {
      await deleteQr(qrId);
      pushToast({ type: 'success', title: 'QR deleted' });
      loadQrs(shortKey);
    } catch (err) {
      pushToast({ type: 'error', title: 'Delete failed', message: err.message });
    }
  };

  const load = useCallback(async (p, size) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchMyLinks(p, size);
      setData(result);
    } catch (err) {
      setError(err.message);
      pushToast({ type: 'error', title: 'Could not load links', message: err.message });
    } finally {
      setLoading(false);
    }
  }, [pushToast]);

  useEffect(() => {
    load(page, pageSize);
  }, [page, pageSize, load]);

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteLink(pendingDelete.shortKey);
      setData((prev) =>
        prev
          ? { ...prev, content: prev.content.filter((l) => l.shortKey !== pendingDelete.shortKey) }
          : prev
      );
      pushToast({ type: 'success', title: 'Link deleted' });
      setPendingDelete(null);
    } catch (err) {
      pushToast({ type: 'error', title: 'Delete failed', message: err.message });
    } finally {
      setDeleting(false);
    }
  };

  const copyShort = async (shortUrl) => {
    try {
      await navigator.clipboard.writeText(shortUrl);
      pushToast({ type: 'success', title: 'Copied to clipboard' });
    } catch {
      pushToast({ type: 'error', title: 'Copy failed' });
    }
  };

  const totalPages = data?.totalPages ?? 0;
  const totalElements = data?.totalElements ?? 0;
  const items = data?.content ?? [];

  return (
    <div className="animate-fade-in flex min-h-screen flex-col bg-background">
      <TopNav />

      <main className="mx-auto w-full max-w-max-width flex-1 px-gutter py-margin md:py-lg">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-headline-lg-mobile text-on-surface md:text-headline-lg">
              My Links
            </h1>
            <p className="mt-1.5 text-body-md text-on-surface-variant">
              {totalElements} link{totalElements === 1 ? '' : 's'} — manage, copy, or dive into analytics.
            </p>
          </div>
          <Link
            to="/"
            className="brand-btn inline-flex w-fit items-center gap-2 rounded-lg px-4 py-2.5 text-body-sm"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_link</span>
            New short link
          </Link>
        </div>

        {/* States */}
        {loading && !data && (
          <div className="grid place-items-center rounded-2xl border border-outline-variant bg-surface-container-lowest p-xl shadow-soft">
            <Spinner size={22} color="rgb(37 99 235)" label="Loading your links…" />
          </div>
        )}

        {!loading && !error && items.length === 0 && <EmptyState />}

        {error && !loading && (
          <div className="rounded-2xl border border-error/30 bg-error-container/40 p-md text-on-error-container">
            <div className="flex items-center gap-2 font-semibold">
              <span className="material-symbols-outlined">error</span>
              Something went wrong
            </div>
            <p className="mt-1 text-body-sm">{error}</p>
            <button
              onClick={() => load(page, pageSize)}
              className="mt-3 rounded-lg border border-error/30 bg-surface-container-lowest px-3 py-1.5 text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
            >
              Retry
            </button>
          </div>
        )}

        {items.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-soft">
            {/* Table header (desktop) */}
            <div className="hidden grid-cols-12 gap-4 border-b border-outline-variant bg-surface-container-low px-5 py-3 text-label-caps uppercase text-secondary md:grid">
              <div className="col-span-3">Short link</div>
              <div className="col-span-3">Destination</div>
              <div className="col-span-2">Created</div>
              <div className="col-span-4 text-right">Actions</div>
            </div>

            <div className="divide-y divide-outline-variant">
              {items.map((l) => (
                <div key={l.shortKey}>
                  <LinkRow
                    link={l}
                    expanded={expanded === l.shortKey}
                    onCopy={() => copyShort(l.shortUrl)}
                    onAnalytics={() =>
                      navigate(`/links/${encodeURIComponent(l.shortKey)}/analytics`, { state: { link: l } })
                    }
                    onDelete={() => setPendingDelete(l)}
                    onToggleDetails={() => toggleDetails(l.shortKey)}
                  />
                  {expanded === l.shortKey && (
                    <DetailsPanel
                      link={l}
                      state={qrCache[l.shortKey]}
                      onAdd={() => setEditor({ shortKey: l.shortKey, shortUrl: l.shortUrl, qr: null })}
                      onEdit={(qr) => setEditor({ shortKey: l.shortKey, shortUrl: l.shortUrl, qr })}
                      onDelete={(qrId) => handleDeleteQr(l.shortKey, qrId)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="grid h-9 w-9 place-items-center rounded-lg border border-outline-variant text-on-surface-variant transition-colors hover:text-on-surface disabled:opacity-40"
              aria-label="Previous page"
            >
              <span className="material-symbols-outlined">chevron_left</span>
            </button>
            <div className="text-body-sm text-on-surface-variant">
              Page <span className="font-semibold text-on-surface">{page + 1}</span> of {totalPages}
            </div>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1 || loading}
              className="grid h-9 w-9 place-items-center rounded-lg border border-outline-variant text-on-surface-variant transition-colors hover:text-on-surface disabled:opacity-40"
              aria-label="Next page"
            >
              <span className="material-symbols-outlined">chevron_right</span>
            </button>
          </div>
        )}
      </main>

      <Footer />

      <Modal
        open={!!pendingDelete}
        onClose={() => !deleting && setPendingDelete(null)}
        labelledBy="delete-link-title"
      >
        <div className="p-md">
          <div className="mb-md flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-error-container text-error">
              <span className="material-symbols-outlined">delete_forever</span>
            </div>
            <div className="flex-1">
              <h3 id="delete-link-title" className="text-headline-md text-on-surface">
                Delete this link?
              </h3>
              <p className="mt-1 text-body-sm text-on-surface-variant">
                Analytics for this link will be lost. This action is permanent and cannot be undone.
              </p>
              {pendingDelete && (
                <div className="mt-3 rounded-lg border border-outline-variant bg-surface-container-low p-3 text-body-sm">
                  <div className="font-mono font-medium text-primary">{stripProtocol(pendingDelete.shortUrl)}</div>
                  <div className="mt-1 truncate text-on-surface-variant" title={pendingDelete.originalUrl}>
                    {pendingDelete.originalUrl}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              onClick={() => setPendingDelete(null)}
              disabled={deleting}
              className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-body-md font-medium text-on-surface transition-colors hover:bg-surface-container disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center justify-center gap-2 rounded-lg bg-error px-4 py-2 text-body-md font-semibold text-on-error transition-opacity hover:opacity-90 disabled:opacity-70"
            >
              {deleting ? <Spinner size={16} color="#fff" label="Deleting…" /> : 'Delete link'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={!!editor} onClose={() => !savingEditor && setEditor(null)} labelledBy="qr-editor-title" widthClass="max-w-2xl">
        <div className="p-md">
          <h3 id="qr-editor-title" className="mb-4 text-headline-md text-on-surface">
            {editor?.qr ? 'Edit QR code' : 'New QR code'}
          </h3>
          {editor && (
            <Suspense
              fallback={
                <div className="grid place-items-center py-8">
                  <Spinner size={20} color="rgb(37 99 235)" label="Loading QR studio…" />
                </div>
              }
            >
              <QrStudio
                data={editor.shortUrl}
                initialConfig={editor.qr?.config}
                fileName={editor.shortKey}
                onSave={saveEditor}
                saving={savingEditor}
                onCancel={() => !savingEditor && setEditor(null)}
              />
            </Suspense>
          )}
        </div>
      </Modal>
    </div>
  );
}

function DetailsPanel({ link, state, onAdd, onEdit, onDelete }) {
  const items = state?.items ?? [];
  const canAdd = !state?.loading && items.length < 2;

  return (
    <div className="border-t border-outline-variant bg-surface-container-low px-4 py-4 md:px-5">
      {state?.loading && (
        <div className="grid place-items-center py-6">
          <Spinner size={18} color="rgb(37 99 235)" label="Loading QR codes…" />
        </div>
      )}

      {state?.error && !state.loading && <p className="text-body-sm text-error">{state.error}</p>}

      {!state?.loading && !state?.error && (
        <Suspense
          fallback={
            <div className="grid place-items-center py-6">
              <Spinner size={18} color="rgb(37 99 235)" label="Loading…" />
            </div>
          }
        >
        <div className="flex flex-wrap gap-4">
          {items.map((qr) => (
            <div
              key={qr.qrId}
              className="flex w-40 flex-col items-center gap-2 rounded-xl border border-outline-variant bg-surface-container-lowest p-3"
            >
              <div className="grid aspect-square w-full place-items-center rounded-lg bg-white p-2">
                <QrPreview config={qr.config} data={link.shortUrl} className="h-full w-full" />
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => onEdit(qr)}
                  className="inline-flex items-center gap-1 rounded-lg border border-outline-variant px-2.5 py-1.5 text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
                  Edit
                </button>
                <button
                  onClick={() => onDelete(qr.qrId)}
                  aria-label="Delete QR code"
                  className="grid h-8 w-8 place-items-center rounded-lg border border-outline-variant text-on-surface-variant transition-colors hover:border-error/40 hover:text-error"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
                </button>
              </div>
            </div>
          ))}

          {canAdd && (
            <button
              onClick={onAdd}
              className="flex h-[188px] w-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-outline-variant text-on-surface-variant transition-colors hover:border-outline hover:text-on-surface"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>add</span>
              <span className="text-body-sm font-medium">Add QR code</span>
            </button>
          )}

          {!canAdd && items.length === 0 && (
            <p className="py-4 text-body-sm text-on-surface-variant">No QR codes yet.</p>
          )}
        </div>
        </Suspense>
      )}
    </div>
  );
}

function LinkRow({ link, onCopy, onAnalytics, onDelete, onToggleDetails, expanded }) {
  const shortDisplay = stripProtocol(link.shortUrl);
  return (
    <div className="grid grid-cols-1 gap-3 px-4 py-4 transition-colors hover:bg-surface-container-low md:grid-cols-12 md:items-center md:gap-4 md:px-5">
      {/* Short link */}
      <div className="flex min-w-0 items-center gap-2 md:col-span-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-outline-variant bg-surface-container text-on-surface-variant">
          <span className="material-symbols-outlined" style={{ fontSize: 17 }}>link</span>
        </span>
        <a
          href={link.shortUrl}
          target="_blank"
          rel="noreferrer"
          className="truncate font-mono text-body-sm font-medium text-primary hover:underline"
          title={link.shortUrl}
        >
          {shortDisplay}
        </a>
      </div>

      {/* Destination */}
      <div className="flex min-w-0 flex-col md:col-span-3">
        <span className="text-label-caps uppercase text-secondary md:hidden">Destination</span>
        <span className="truncate text-body-sm text-on-surface-variant" title={link.originalUrl}>
          {link.originalUrl}
        </span>
      </div>

      {/* Created */}
      <div className="flex items-center gap-2 md:col-span-2">
        <span className="text-label-caps uppercase text-secondary md:hidden">Created</span>
        <span className="text-body-sm text-on-surface-variant">{formatDate(link.createdAt)}</span>
      </div>

      {/* Actions */}
      <div className="mt-1 flex items-center gap-1.5 md:col-span-4 md:mt-0 md:justify-end">
        <button
          onClick={onCopy}
          aria-label="Copy short URL"
          className="grid h-9 w-9 place-items-center rounded-lg border border-outline-variant text-on-surface-variant transition-colors hover:border-outline hover:text-on-surface"
          title="Copy"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>content_copy</span>
        </button>
        <button
          onClick={onAnalytics}
          className="inline-flex items-center gap-1.5 rounded-lg border border-outline-variant px-3 py-1.5 text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>bar_chart</span>
          Analytics
        </button>
        <button
          onClick={onToggleDetails}
          aria-expanded={expanded}
          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-outline-variant px-3 py-1.5 text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
          title="QR Codes"
        >
          QR Codes
          <span
            className="material-symbols-outlined transition-transform"
            style={{ fontSize: 18, transform: expanded ? 'rotate(180deg)' : 'none' }}
          >
            expand_more
          </span>
        </button>
        <button
          onClick={onDelete}
          aria-label="Delete link"
          className="grid h-9 w-9 place-items-center rounded-lg border border-error/30 text-error/70 transition-colors hover:border-error/50 hover:bg-error-container/40 hover:text-error"
          title="Delete"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest p-xl text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-outline-variant bg-surface-container text-on-surface-variant">
        <span className="material-symbols-outlined">link_off</span>
      </div>
      <h3 className="mt-4 text-headline-md text-on-surface">No links yet</h3>
      <p className="mx-auto mt-1.5 max-w-sm text-body-sm text-on-surface-variant">
        Shorten your first URL to start tracking clicks, visitors, and locations.
      </p>
      <Link
        to="/"
        className="brand-btn mt-5 inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-body-sm"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_link</span>
        Create short link
      </Link>
    </div>
  );
}
