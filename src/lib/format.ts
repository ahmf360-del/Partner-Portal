export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return phone;
  const last = digits.slice(-2);
  const country = phone.startsWith("+") ? phone.slice(0, 3) : "";
  return `${country} •• •••• ${last}`;
}

export function ticketCode(id: number): string {
  return `BF-${1000 + id}`;
}

export function timeUntil(iso: string): string {
  const diffMs = new Date(iso).getTime() - Date.now();
  const overdue = diffMs < 0;
  const abs = Math.abs(diffMs);
  const mins = Math.round(abs / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  let label: string;
  if (days >= 1) label = `${days}d ${hours % 24}h`;
  else if (hours >= 1) label = `${hours}h ${mins % 60}m`;
  else label = `${mins}m`;

  return overdue ? `${label} overdue` : `due in ${label}`;
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
