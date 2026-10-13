"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import ArticleView from "@/components/efsw/ArticleView";
import { SiteNav } from "@/components/efsw/SiteNav";
import { ADMIN_CONTENT_KEY, getAdminContent } from "@/lib/admin-data";
import { getLibraryDocuments, type LibraryDocument } from "@/lib/academic-library";

/** Local development reads the same saved library as the collection page.
 * A missing record stays missing instead of reviving a bundled server seed. */
export default function LocalDocumentView({ slug }: { slug: string }) {
  const [document, setDocument] = useState<LibraryDocument | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const refresh = () => {
      const document = getLibraryDocuments(getAdminContent()).find((item) => item.id === slug);
      setDocument(document ?? null);
      setLoading(false);
    };
    const onStorage = (event: StorageEvent) => { if (event.key === ADMIN_CONTENT_KEY) refresh(); };
    const onVisibility = () => { if (window.document.visibilityState === "visible") refresh(); };
    refresh();
    window.addEventListener("storage", onStorage);
    window.addEventListener("pageshow", refresh);
    window.addEventListener("efsw:content-changed", refresh);
    window.document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("pageshow", refresh);
      window.removeEventListener("efsw:content-changed", refresh);
      window.document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [slug]);

  if (!loading && document) {
    return <ArticleView key={document.id} kind={document.kind} slug={slug} seed={document} backHref="/academic-documents" contentSource="local-library" />;
  }

  return <>
    <SiteNav />
    <div className="efsw-article-page academic-document-detail">
      {loading ? <div className="academic-document-detail__loading" role="status"><BookOpen size={28} aria-hidden="true" /><p>Loading the document…</p></div>
        : <div className="academic-document-detail__missing"><BookOpen size={40} strokeWidth={1.3} aria-hidden="true" /><h1>This document is unavailable.</h1><p>It may have been removed or is no longer published. Explore the library for more resources.</p><Link href="/academic-documents"><ArrowLeft size={18} aria-hidden="true" /> Back to documents</Link></div>}
    </div>
  </>;
}
