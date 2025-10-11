import { ShareViewer } from "@/components/share-viewer";

export default function SharePage({ params }: { params: { token: string } }) {
  return <ShareViewer token={params.token} />;
}
