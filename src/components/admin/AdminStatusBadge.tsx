import { Badge, type BadgeProps } from "@/components/ui/badge";

const paymentStatusLabels: Record<string, string> = {
  paid: "Payé",
  pending: "En attente",
  manual_pending: "Paiement manuel",
};

const studentPaymentStatusLabels: Record<string, string> = {
  paid: "Accès actif",
  pending: "Paiement en attente",
  manual_pending: "Paiement manuel",
};

const paymentStatusVariants: Record<string, NonNullable<BadgeProps["variant"]>> = {
  paid: "success",
  pending: "warning",
  manual_pending: "secondary",
};

const withdrawalStatusLabels: Record<string, string> = {
  pending: "En attente",
  paid: "Payé",
  rejected: "Rejeté",
};

const withdrawalStatusVariants: Record<string, NonNullable<BadgeProps["variant"]>> = {
  pending: "warning",
  paid: "success",
  rejected: "destructive",
};

type StatusBadgeProps = {
  status: string;
  className?: string;
};

export function PaymentStatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge variant={paymentStatusVariants[status] ?? "muted"} className={className}>
      {paymentStatusLabels[status] ?? status}
    </Badge>
  );
}

export function StudentPaymentStatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge variant={paymentStatusVariants[status] ?? "muted"} className={className}>
      {studentPaymentStatusLabels[status] ?? status}
    </Badge>
  );
}

export function WithdrawalStatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge variant={withdrawalStatusVariants[status] ?? "muted"} className={className}>
      {withdrawalStatusLabels[status] ?? status}
    </Badge>
  );
}

export { paymentStatusLabels, studentPaymentStatusLabels, withdrawalStatusLabels };
