export type ServiceBookingStatus = "new" | "contacted" | "closed";

export type ServiceBookingRecord = {
  id: string;
  serviceSlug: string;
  serviceTitle: string;
  name: string;
  email: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  message?: string;
  status: ServiceBookingStatus;
  createdAt: string;
};

export const serviceBookingStatusLabels: Record<ServiceBookingStatus, string> = {
  new: "Nouvelle",
  contacted: "Contacté",
  closed: "Clôturée",
};

export const serviceBookingStatusClasses: Record<ServiceBookingStatus, string> = {
  new: "bg-sky-100 text-sky-800",
  contacted: "bg-amber-100 text-amber-900",
  closed: "bg-emerald-100 text-emerald-800",
};
