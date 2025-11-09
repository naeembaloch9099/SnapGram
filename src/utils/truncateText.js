export const truncateText = (str, n = 100) =>
  str?.length > n ? str.slice(0, n) + "…" : str;
