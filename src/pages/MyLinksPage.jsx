import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import TopNav from '../components/TopNav';
import Footer from '../components/Footer';
import Modal from '../components/Modal';
import Spinner from '../components/Spinner';
import useResponsivePageSize from '../hooks/useResponsivePageSize';
import { deleteLink, fetchMyLinks } from '../lib/api';
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
    <div className="flex min-h-screen flex-col bg-background">
      <TopNav />

      <main className="mx-auto w-full max-w-max-width flex-1 px-gutter py-margin md:py-xl">
        <div className="mb-margin flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-headline-lg-mobile font-semibold text-on-surface md:text-headline-lg">
              My Links
            </h1>
            <p className="mt-1 text-body-md text-on-surface-variant">
              {totalElements} link{totalElements === 1 ? '' : 's'} total — manage, copy, or dive into analytics.
            </p>
          </div>
          <Link
            to="/"
            className="brand-btn inline-flex w-fit items-center gap-2 rounded-lg px-4 py-2 text-body-md font-semibold"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_link</span>
            Shorten a new URL
          </Link>
        </div>

        {/* List header (desktop) */}
        <div className="hidden grid-cols-12 gap-4 border-b border-outline-variant px-4 py-2 text-label-caps uppercase text-secondary md:grid">
          <div className="col-span-3">Short Link</div>
          <div className="col-span-5">Original URL</div>
          <div className="col-span-2">Created</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {/* States */}
        {loading && !data && (
          <div className="mt-6 grid place-items-center rounded-2xl border border-outline-variant bg-surface-container-lowest p-xl shadow-soft">
            <Spinner size={24} color="#2563eb" label="Loading your links…" />
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <EmptyState />
        )}

        {error && !loading && (
          <div className="mt-6 rounded-2xl border border-error/30 bg-error-container/40 p-md text-on-error-container">
            <div className="flex items-center gap-2 font-semibold">
              <span className="material-symbols-outlined">error</span>
              Something went wrong
            </div>
            <p className="mt-1 text-body-sm">{error}</p>
            <button
              onClick={() => load(page, pageSize)}
              className="mt-3 rounded-lg border border-error/30 bg-surface-container-lowest px-3 py-1.5 text-body-sm font-medium text-on-surface hover:bg-surface-container"
            >
              Retry
            </button>
          </div>
        )}

        {items.length > 0 && (
          <div className="mt-2 flex flex-col gap-2">
            {items.map((l) => (
              <LinkRow
                key={l.shortKey}
                link={l}
                onCopy={() => copyShort(l.shortUrl)}
                onAnalytics={() =>
                  navigate(`/links/${encodeURIComponent(l.shortKey)}/analytics`, { state: { link: l } })
                }
                onDelete={() => setPendingDelete(l)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-margin flex items-center justify-center gap-3">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
              className="grid h-9 w-9 place-items-center rounded-lg border border-outline-variant text-secondary transition-colors hover:bg-surface-container disabled:opacity-40"
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
              className="grid h-9 w-9 place-items-center rounded-lg border border-outline-variant text-secondary transition-colors hover:bg-surface-container disabled:opacity-40"
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
            <div className="grid h-12 w-12 place-items-center rounded-full bg-error-container text-error">
              <span className="material-symbols-outlined">delete_forever</span>
            </div>
            <div className="flex-1">
              <h3 id="delete-link-title" className="text-headline-md font-semibold text-on-surface">
                Delete this link?
              </h3>
              <p className="mt-1 text-body-sm text-on-surface-variant">
                Data for this link will be lost. This action is permanent and cannot be undone.
              </p>
              {pendingDelete && (
                <div className="mt-3 rounded-lg border border-outline-variant bg-surface p-3 text-body-sm">
                  <div className="font-mono text-primary">{pendingDelete.shortUrl}</div>
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
              className="rounded-lg border border-outline-variant bg-surface-container-lowest px-4 py-2 text-body-md font-medium text-on-surface hover:bg-surface-container disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center justify-center gap-2 rounded-lg bg-error px-4 py-2 text-body-md font-semibold text-on-error hover:opacity-90 disabled:opacity-70"
            >
              {deleting ? <Spinner size={16} color="#fff" label="Deleting…" /> : 'Confirm'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function LinkRow({ link, onCopy, onAnalytics, onDelete }) {
  return (
    <div className="grid grid-cols-1 items-center gap-4 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 shadow-soft transition-shadow hover:shadow-md md:grid-cols-12">
      <div className="flex min-w-0 flex-col md:col-span-3">
        <span className="text-label-caps uppercase text-secondary md:hidden">Short Link</span>
        <a
          href={link.shortUrl}
          target="_blank"
          rel="noreferrer"
          className="truncate text-body-md font-semibold text-primary hover:underline"
          title={link.shortUrl}
        >
          {link.shortUrl}
        </a>
      </div>
      <div className="flex min-w-0 flex-col md:col-span-5">
        <span className="text-label-caps uppercase text-secondary md:hidden">Original URL</span>
        <span className="truncate text-body-sm text-on-surface-variant" title={link.originalUrl}>
          {link.originalUrl}
        </span>
      </div>
      <div className="flex flex-col md:col-span-2">
        <span className="text-label-caps uppercase text-secondary md:hidden">Created</span>
        <span className="text-body-sm text-secondary">{formatDate(link.createdAt)}</span>
      </div>
      <div className="flex flex-wrap items-center justify-end gap-2 md:col-span-2">
        <button
          onClick={onCopy}
          aria-label="Copy short URL"
          className="grid h-9 w-9 place-items-center rounded-lg border border-outline-variant text-secondary transition-colors hover:bg-surface-container hover:text-primary"
          title="Copy"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>content_copy</span>
        </button>
        <button
          onClick={onAnalytics}
          className="inline-flex items-center gap-1 rounded-lg border border-outline-variant bg-surface-container-lowest px-3 py-1.5 text-body-sm font-medium text-on-surface transition-colors hover:bg-surface-container"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>bar_chart</span>
          Analytics
        </button>
        <button
          onClick={onDelete}
          className="inline-flex items-center gap-1 rounded-lg border border-error/30 px-3 py-1.5 text-body-sm font-semibold text-error transition-colors hover:bg-error-container/60"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
          Delete
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="mt-6 rounded-2xl border border-dashed border-outline-variant bg-surface-container-lowest p-xl text-center shadow-soft">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-secondary-container text-primary">
        <span className="material-symbols-outlined">link_off</span>
      </div>
      <h3 className="mt-3 text-headline-md font-semibold text-on-surface">No links yet</h3>
      <p className="mt-1 text-body-sm text-on-surface-variant">
        Shorten your first URL to start tracking clicks and visitors.
      </p>
      <Link
        to="/"
        className="brand-btn mt-md inline-flex items-center gap-2 rounded-lg px-4 py-2 text-body-md font-semibold"
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add_link</span>
        Create short link
      </Link>
    </div>
  );
}
