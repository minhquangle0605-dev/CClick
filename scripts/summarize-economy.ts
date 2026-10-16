import { readFileSync, writeFileSync } from 'node:fs';
import { amount } from '../src/shared/amount';
import type { simulate } from './simulation/simulate';
type Report = { runs: Awaited<ReturnType<typeof simulate>>[] };
const before = JSON.parse(readFileSync('docs/balance/simulation-before.json', 'utf8')) as Report;
const after = JSON.parse(readFileSync('docs/balance/simulation-current.json', 'utf8')) as Report;
const names = { active: 'Chủ động', passive: 'Thụ động', mixed: 'Hỗn hợp' } as const;
const median = (values: string[]) => values.sort(amount.compare)[Math.floor(values.length / 2)]!;
const lines = [
  '# Kết quả mô phỏng kinh tế',
  '',
  'Ngày 15/10/2026. Ba seed cố định 17, 73, 211 cho mỗi lịch chơi; trung vị của ba lượt. Đây là kết quả của chính sách tự động đã mô tả, không phải cam kết thời gian cho mọi người chơi.',
  '',
  '| Lối chơi | Mốc | Tổng sản xuất cũ (0.5.0) | Tổng sản xuất mới (0.6.0) | CPS mới | Rương mới |',
  '| --- | --- | --- | --- | --- | --- |',
];
for (const profile of ['active', 'passive', 'mixed'] as const) {
  for (const [seconds, label] of [
    [3600, '1 giờ'],
    [86400, '1 ngày'],
    [604800, '7 ngày'],
    [2592000, '30 ngày'],
  ] as const) {
    const samples = (report: Report) =>
      report.runs
        .filter((r) => r.profile === profile)
        .map((r) => r.samples.find((s) => s.seconds === seconds)!);
    const old = samples(before),
      current = samples(after);
    const value = (rows: typeof old, field: string) =>
      amount.format(median(rows.map((s) => String(s[field]))));
    lines.push(
      `| ${names[profile]} | ${label} | ${value(old, 'produced')} | ${value(current, 'produced')} | ${value(current, 'cps')} | ${value(current, 'chests')} |`,
    );
  }
}
lines.push(
  '',
  '## Thời gian đến mốc 10^15',
  '',
  '| Lối chơi | Trung vị | Khoảng ba seed |',
  '| --- | --- | --- |',
);
for (const profile of ['active', 'passive', 'mixed'] as const) {
  const times = after.runs
    .filter((r) => r.profile === profile)
    .map((r) => r.milestones['1000000000000000']! / 86400)
    .sort((a, b) => a - b);
  lines.push(
    `| ${names[profile]} | ${times[1]!.toFixed(2)} ngày | ${times[0]!.toFixed(2)}–${times[2]!.toFixed(2)} ngày |`,
  );
}
lines.push(
  '',
  'Bản cũ chưa đạt 10^15 trong cả chín lượt 30 ngày. Số mốc là lúc thực sự ghi nhận khi chơi/quay lại; báo cáo checkpoint trong khoảng vắng mặt chỉ dự phóng một snapshot riêng, không chia nhỏ khoảng offline hoặc nhận vượt cap.',
  '',
  '## Phạm vi và cách đọc',
  '',
  '- Chủ động: 6 phiên × 10 phút/ngày, 2 click/giây, thu khoảng 70% vật thể sự kiện theo hàm hash cố định.',
  '- Thụ động: 2 phiên × 3 phút/ngày, 15 click ban đầu để mua máy; sau đó không click, thu khoảng 30% vật thể. Có cap offline 8 giờ mỗi lần vắng.',
  '- Hỗn hợp: 4 phiên × 5 phút/ngày, 1 click/giây, thu khoảng 70% vật thể.',
  '- Các phiên chia đều trong ngày. Engine chạy bước 1 giây khi hoạt động; mua mỗi 15 giây theo thời gian hoàn vốn biên trong các mục mua được. Click được gom trong giây, nên thời gian sớm nhất có độ phân giải 1 giây. Đây không phải chiến lược tối ưu.',
  '- Nhận daily/thành tích, mở rương có sẵn, mua chìa cho rương được tặng rồi ưu tiên rương bạc. Trang bị theo danh sách cố định, nâng thẻ khi chi phí không quá 20% ví; dùng vật phẩm đã kiếm được. Chính sách không mô phỏng mọi phong cách chơi.',
  '- Tổng Gold kiếm/tiêu, từng nguồn Coin, cấp thẻ, số rương, máy, mốc và khoảng lâu nhất giữa hai lần mua tính theo thời gian chủ động nằm trong JSON. Khoảng không mua không đồng nghĩa không có lựa chọn.',
  '- Điểm 1 giờ/1 ngày/7 ngày/30 ngày đều được kiểm tra bằng save codec và sổ Coin. Ba seed cho biết độ lệch mẫu nhỏ; không phải khoảng tin cậy thống kê.',
  '- Thu nhập offline chiếm phần lớn trong lịch mở vài lần/ngày. Thẻ cao nhất chưa đồng loạt đạt cấp 10 sau 30 ngày; việc sưu tập vẫn còn mục tiêu. Cân bằng cảm giác chạm và độ dài phiên cần thử trên trình duyệt thật.',
  '',
  'Dữ liệu: [trước](simulation-before.json), [sau](simulation-current.json), [catalog cũ](catalog-0.5.0.json), [kiểm tra nguồn thưởng](economy-audit.json), [đo lõi](engine-benchmark.json).',
  '',
  'Chạy lại: `npm run simulate` (vài phút), rồi `npx tsx scripts/summarize-economy.ts`. Muốn so sánh lại bản cũ: `npm run simulate -- --catalog docs/balance/catalog-0.5.0.json --out docs/balance/simulation-before.json`.',
);
writeFileSync('docs/balance/REPORT.md', lines.join('\n') + '\n');
console.log(lines.join('\n'));
