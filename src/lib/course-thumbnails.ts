export const THUMBNAIL_GRADIENT_PRESETS = [
  { id: "violet", label: "Violet", gradient: "from-violet-600 via-indigo-600 to-blue-700" },
  { id: "emerald", label: "Émeraude", gradient: "from-emerald-600 to-teal-700" },
  { id: "rose", label: "Rose", gradient: "from-rose-600 via-pink-600 to-fuchsia-700" },
  { id: "amber", label: "Ambre", gradient: "from-amber-500 via-orange-600 to-red-600" },
  { id: "sky", label: "Ciel", gradient: "from-sky-500 via-blue-600 to-indigo-700" },
  { id: "slate", label: "Ardoise", gradient: "from-slate-700 via-slate-800 to-slate-900" },
] as const;

export type CourseThumbnailData = {
  gradient: string;
  label: string;
  imageUrl?: string;
};
