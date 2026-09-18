// src/app/admin/editor/[postId]/page.tsx
import { notFound } from "next/navigation";
import EditorClient from "./editor-client";
import { getPostById } from "../../posts/actions";

export default async function EditorPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;

  // If it's a new post, we pass null and the client will handle it.
  if (postId === "new") {
    // This case will be handled when you click "New Post" which creates a post and redirects
    // For now, this is a placeholder. You should not navigate here directly.
    return notFound();
  }

  const { post, blocks, success } = await getPostById(postId);

  if (!success || !post) {
    return notFound();
  }

  return <EditorClient initialPost={post} initialBlocks={blocks} />;
}
