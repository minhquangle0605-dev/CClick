export function formatEffectDuration(seconds: number): string {
  const total = Math.max(0, Math.ceil(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainder = total % 60;
  return [
    hours ? `${hours} giờ` : '',
    minutes ? `${minutes} phút` : '',
    remainder || !total ? `${remainder} giây` : '',
  ]
    .filter(Boolean)
    .join(' ');
}
