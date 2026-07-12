import { createFileRoute } from "@tanstack/react-router";
import { handleAdminVideoUpload } from "@/server/admin-video-upload";

export const Route = createFileRoute("/api/admin/upload-video")({
  server: {
    handlers: {
      POST: async ({ request }) => handleAdminVideoUpload(request),
    },
  },
});
