const DATE_FORMATTER = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta"
});

const TIME_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Jakarta"
});

function getValidDate(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export function formatDateTimeParts(value: string | null | undefined) {
  const date = getValidDate(value);

  if (!date) {
    return {
      date: "-",
      time: "-"
    };
  }

  return {
    date: DATE_FORMATTER.format(date),
    time: TIME_FORMATTER.format(date)
  };
}

export function formatDateTime(
  value: string | null | undefined,
  options?: { separator?: "comma" | "bullet" }
) {
  const parts = formatDateTimeParts(value);

  if (parts.date === "-" || parts.time === "-") {
    return "-";
  }

  return options?.separator === "bullet"
    ? `${parts.date} • ${parts.time}`
    : `${parts.date}, ${parts.time}`;
}

export function formatDate(value: string | null | undefined) {
  const date = getValidDate(value);

  if (!date) {
    return "-";
  }

  return DATE_FORMATTER.format(date);
}
