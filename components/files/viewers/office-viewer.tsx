"use client";

// Office viewer using Microsoft's online viewer
// It requires the document to be publicly accessible URL. If your storage requires signed URLs,
// pass the resolved public/signed URL in `src`.

export function OfficeViewer({ src }: { src: string }) {
  const encoded = encodeURIComponent(src);
  const viewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encoded}`;
  return <iframe src={viewerUrl} className="h-full w-full" />;
}

