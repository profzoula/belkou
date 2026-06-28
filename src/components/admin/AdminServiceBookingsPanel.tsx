import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Calendar, Mail, Phone, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminUpdateServiceBookingStatus, getAdminServiceBookings } from "@/lib/fns/admin";
import {
  serviceBookingStatusClasses,
  serviceBookingStatusLabels,
  type ServiceBookingRecord,
  type ServiceBookingStatus,
} from "@/lib/service-booking-storage";
import { cn } from "@/lib/utils";

type AdminServiceBookingsPanelProps = {
  onCountsChange?: (newCount: number) => void;
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function AdminServiceBookingsPanel({ onCountsChange }: AdminServiceBookingsPanelProps) {
  const loadFn = useServerFn(getAdminServiceBookings);
  const updateStatusFn = useServerFn(adminUpdateServiceBookingStatus);
  const [bookings, setBookings] = useState<ServiceBookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ServiceBookingStatus>("all");

  const load = async () => {
    setLoading(true);
    try {
      const result = await loadFn();
      setBookings(result.bookings);
      onCountsChange?.(result.newCount);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return bookings.filter((booking) => {
      if (statusFilter !== "all" && booking.status !== statusFilter) return false;
      if (!query) return true;
      return (
        booking.name.toLowerCase().includes(query) ||
        booking.email.toLowerCase().includes(query) ||
        booking.phone.toLowerCase().includes(query) ||
        booking.serviceTitle.toLowerCase().includes(query)
      );
    });
  }, [bookings, search, statusFilter]);

  const handleStatusChange = async (id: string, status: ServiceBookingStatus) => {
    setUpdatingId(id);
    try {
      const result = await updateStatusFn({ data: { id, status } });
      setBookings(result.bookings);
      onCountsChange?.(result.newCount);
      toast.success("Statut mis à jour");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Mise à jour impossible");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Rechercher nom, email, service…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="new">Nouvelles</SelectItem>
            <SelectItem value="contacted">Contactées</SelectItem>
            <SelectItem value="closed">Clôturées</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => load()} disabled={loading}>
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Actualiser
        </Button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground shadow-sm">
          Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-10 text-center text-sm text-muted-foreground shadow-sm">
          Aucune demande de rendez-vous pour le moment.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking) => (
            <article
              key={booking.id}
              className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display font-bold">{booking.name}</h3>
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase",
                        serviceBookingStatusClasses[booking.status],
                      )}
                    >
                      {serviceBookingStatusLabels[booking.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-primary">{booking.serviceTitle}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Reçue le {formatDate(booking.createdAt)}</p>
                </div>
                <Select
                  value={booking.status}
                  disabled={updatingId === booking.id}
                  onValueChange={(value) => handleStatusChange(booking.id, value as ServiceBookingStatus)}
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Nouvelle</SelectItem>
                    <SelectItem value="contacted">Contacté</SelectItem>
                    <SelectItem value="closed">Clôturée</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0" />
                  <a href={`mailto:${booking.email}`} className="text-foreground hover:underline">
                    {booking.email}
                  </a>
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4 shrink-0" />
                  <a href={`tel:${booking.phone}`} className="text-foreground hover:underline">
                    {booking.phone}
                  </a>
                </p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>
                    {booking.preferredDate} · {booking.preferredTime}
                  </span>
                </p>
              </div>

              {booking.message ? (
                <p className="mt-3 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">{booking.message}</p>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
