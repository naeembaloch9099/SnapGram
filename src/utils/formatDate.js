export const formatDate = (iso) => {
  if (!iso) return "";
  const d =
    typeof iso === "string" || typeof iso === "number" ? new Date(iso) : iso;
  if (!(d instanceof Date) || isNaN(d.getTime())) return "";

  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  // if date is in future, show absolute
  if (diffMs < 0) {
    // future date: show absolute
    return formatAbsolute(d);
  }

  const diffS = Math.floor(diffMs / 1000);
  if (diffS < 60) return "just now";

  const diffM = Math.floor(diffS / 60);
  if (diffM < 60) return `${diffM}m`;

  const diffH = Math.floor(diffM / 60);
  if (diffH < 24) return `${diffH}h`;

  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d`;

  const diffW = Math.floor(diffD / 7);
  // show weeks up to 4 (1-4w); after ~4-5 weeks switch to absolute date
  if (diffW >= 1 && diffW <= 4) return `${diffW}w`;

  // beyond ~4-5 weeks show absolute date (month/day), include year if > 1 year
  const yearDiff = now.getFullYear() - d.getFullYear();
  if (yearDiff >= 1) {
    return formatAbsolute(d, true);
  }
  return formatAbsolute(d, false);
};

const formatAbsolute = (dateObj, includeYear = false) => {
  // format like 'Oct 3' or 'Oct 3, 2023'
  try {
    const opts = { month: "short", day: "numeric" };
    if (includeYear) opts.year = "numeric";
    return dateObj.toLocaleString("en-US", opts);
  } catch {
    // fallback
    return dateObj.toLocaleString();
  }
};
