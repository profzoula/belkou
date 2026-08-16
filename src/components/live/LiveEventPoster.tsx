import { Radio } from "lucide-react";
import { CourseThumbnailBanner } from "@/components/course/CourseThumbnailBanner";
import { LiveNowBadge } from "@/components/live/LiveNowBadge";
import { liveEventThumbnail, type PublicLiveSession } from "@/lib/live";

type LiveEventPosterProps = {
  live: PublicLiveSession;
};

export function LiveEventPoster({ live }: LiveEventPosterProps) {
  return (
    <CourseThumbnailBanner
      thumbnail={liveEventThumbnail(live, live.course)}
      slug={live.course.slug}
      aspectClass="h-full w-full"
      className="bg-black"
      showLabel={false}
      showIcon={false}
    >
      <LiveNowBadge
        status={live.status}
        className="absolute bottom-2.5 right-2.5 z-10 rounded px-2 py-1 text-[11px]"
      />
      {live.status === "live" ? (
        <span className="absolute bottom-2.5 left-2.5 z-10 grid size-7 place-items-center rounded-sm bg-red-600 text-white">
          <Radio className="size-3.5" aria-hidden />
        </span>
      ) : null}
    </CourseThumbnailBanner>
  );
}
