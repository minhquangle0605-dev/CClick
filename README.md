# Coin Clicker

Game cá nhân với đồng xu bạc ngôi sao bốn cánh. Chạy trên máy của bạn, không có tài khoản, quảng cáo hay tiền thật.

Bản 1.5 có nền xu bạc động theo ảnh tham chiếu, tự tạm dừng khi tab ẩn/mở cửa sổ chức năng và tuân theo **Giảm chuyển động**. Xem [cấu trúc nền động](docs/19-animated-background.md).

Bản 1.4: ba hỗ trợ có thời gian cộng dồn tối đa 24 giờ mỗi loại; Gold có hình đồng xu rồng; khung mưa vàng thu gọn nằm trên đồng xu chính lớn hơn. Xem [cấu trúc file và quy tắc hỗ trợ](docs/18-boosters-gold-layout.md).

**Hiện tại: giai đoạn 7/7 (P6), bản chơi thử 1.5.0-rc.1.** Có 12 máy, 30 nâng cấp, 12 thẻ, 30 thành tích và toàn bộ hệ thống chơi cá nhân đã triển khai. Giao diện bố trí đồng xu, mưa vàng và cửa hàng trong một màn hình; toàn bộ khung xưởng có thanh cuộn riêng. Thống kê có danh sách vật phẩm/thẻ kèm hình ảnh và lịch sử nhận, tiêu. Nhãn RC được giữ vì âm thanh, cảm ứng trên thiết bị và phiên chơi dài vẫn cần trải nghiệm thực tế.

Tiến trình tự lưu sau click/mua, mỗi 10 giây và khi chuyển nền. Nhận thưởng, mở rương và thao tác vật phẩm chờ ghi thành công trước khi báo hoàn tất. Có 2 bản dự phòng tự động, bản **Trước reset gần nhất** lưu riêng, xuất/nhập JSON và chuyển save schema 1–6 sang schema 7/catalog 0.7.0, giữ tài nguyên và lịch nhận thưởng. Cài đặt âm thanh/rung/hiển thị được giữ khi reset.

Để bắt đầu: auto click luôn chạy 10 lần/giây; bạn có thể chạm thêm hoặc bật **Auto nâng cấp** ở đầu xưởng để game mua máy và nâng cấp bằng Coin. Mở chi tiết vật phẩm để xem lợi ích và hoàn vốn ước tính. Phần khởi đầu được giữ; sáu máy mới và 24 nâng cấp mở rộng phần sau. [Báo cáo cân bằng trước auto](docs/balance/REPORT.md) là dữ liệu lịch sử; tốc độ chơi bản này đã thay đổi.

## Chơi phần mới

- **Auto nâng cấp** ưu tiên món đã mở và đủ Coin theo hiệu quả hoàn vốn; hiển thị mục tiêu, số còn thiếu và thời gian chờ ước tính. **Cài đặt → Hiển thị số** chọn Đầy đủ/Viết tắt, nhớ qua lần mở game. Tab **Tổng quan** đã có danh sách vật phẩm kèm hình và chi tiết nhận/tiêu. Xem [chi tiết bản cập nhật](docs/16-auto-display-fixes.md).
- Auto click **0,1 giây/lần** và auto thu **Gold** luôn bật, kể cả khi tính offline. Nút **Auto nâng cấp** bật/tắt riêng, được lưu theo lượt chơi; mặc định tắt khi cập nhật save cũ.
- Auto chỉ chi Coin cho máy/nâng cấp, tối ưu bộ thẻ trang bị đang có. Gold, vật phẩm và bản trùng thẻ giữ để tự dùng. Cầu vồng, thưởng ngày và thành tích vẫn thao tác thủ công.
- Offline tối đa **24 giờ**. Coin từ máy và auto click hưởng 50% + bonus thẻ; Gold thu theo lịch đầy đủ. Khi bật auto nâng cấp, game mua tại từng thời điểm đủ tiền, không cộng sản lượng của máy mới vào cả khoảng vắng mặt.

- Giao diện gọn: desktop hai cột; màn hình hẹp có nút chuyển **Chơi & mưa vàng / Xưởng nâng cấp**. Cuộn trong khung xưởng để xem toàn bộ chức năng. Xem [cách dùng auto và cấu trúc file](docs/14-automation.md).

- SHOP có bộ lọc **Gần mục tiêu / Tất cả / Đang sở hữu**. Mặc định giữ các mục đã mở và hai mục sắp tới; tab nâng cấp ẩn các mục đã mua trong bộ lọc Gần mục tiêu. Chọn Tất cả để xem toàn bộ nội dung.
- Sáu máy từ **Xưởng đúc quỹ đạo** đến **Lò đúc vô tận**; các nhánh nâng cấp riêng cho sản xuất và sức nhấn. Không thêm tiền thật hoặc hệ thống online.
- Bản ZIP trong `releases/` chạy bằng Node.js và file đã build, không cần `node_modules`. Xem [hướng dẫn bản local](docs/PLAY-LOCAL.md) và [chi tiết giai đoạn 7](docs/12-stage-7.md).

- Mở **Thưởng ngày** để nhận quà. Đổi ngày lúc **00:00 giờ Việt Nam**; bỏ ngày không mất tiến độ, hết 7 lần nhận quay lại phần quà thứ nhất. Time Warp không đẩy lịch ngày.
- Mở **Thành tích** để theo dõi 30 mục tiêu; đạt mốc rồi bấm **Nhận thưởng**. Badge trên nút cho biết số phần quà đang chờ.
- Mở **Thêm → Thống kê**: tab **Vật phẩm** có 7 món, tab **Thẻ công nghệ** có 12 thẻ, mỗi dòng gồm hình minh họa, tổng đã kiếm được, đã tiêu và hiện có. Bấm dòng để xem nguồn nhận/cách tiêu; dùng ô tìm kiếm để lọc tên. Tổng tích lũy giữ qua các lần mở game trong cùng lượt chơi. Save cũ chỉ có số tối thiểu đã biết, ký hiệu **≥**; lịch sử mới được ghi đầy đủ. [Quy tắc và cấu trúc file thống kê](docs/15-item-statistics.md).
- Tab **Tổng quan** mở đầu bằng danh sách **Coin và hoạt động** gồm 19 dòng có hình minh họa. Bấm từng dòng để xem cách tính và nguồn chi tiết; số dài không ngắt giữa chữ số. Tiếp theo là tiến độ **10^15 Coin tổng sản xuất**, danh sách vật phẩm và thẻ. [Cấu trúc phần Tổng quan](docs/17-overview-detail-list.md). Thu nhập từ bản cũ chưa có dữ liệu nguồn được ghi riêng, không bị mất.
- Vào **Cài đặt → Bắt đầu lượt chơi mới**, đọc phần dữ liệu sẽ xóa rồi nhập `RESET` nếu muốn chơi lại. Game lưu backup riêng trước khi tạo lượt mới; khôi phục thủ công tại **Thêm → Sao lưu**. Reset không cho thưởng tái sinh.
- Hướng dẫn và thuật ngữ ở **Thêm → Hướng dẫn**. Âm/rung khi nhận daily, thành tích và mở rương tuân theo tùy chọn trong Cài đặt; phần cứng thực tế chưa được xác minh trong phiên này.

Thẻ và rương từ giai đoạn 5:

- Đạt tổng sản xuất **1.000 Coin**, vào **Rương & chìa** nhận rương bạc miễn phí. Xem thưởng và tỷ lệ rơi rồi mở; khi tải lại, game hiện kết quả chưa xem và không phát thêm thưởng.
- Trong **SHOP → Vật phẩm**, rương bạc giá **20 Gold**, rương vàng **50 Gold**, Chìa sao **15 Gold**. Mở rương vàng tốn 1 rương + 1 chìa. Gold kiếm từ sự kiện trong game.
- Vào **Thẻ công nghệ**: trang bị 2 thẻ, mở ô thứ ba ở tổng sản xuất **1.000.000 Coin**. Chỉ thẻ đang dùng có tác dụng; xem trước chỉ số rồi trang bị/tháo hoặc nâng bằng bản trùng + Coin. Có 3 tổ hợp tự kích hoạt, bao gồm Rainbow/Frenzy.
- Thẻ tối đa cấp 10; bản trùng tiếp theo đổi thành Gold. Bảng rơi, chi phí nâng và luật thời gian: [chi tiết giai đoạn 5](docs/10-stage-5.md).

Các chức năng ở giai đoạn trước vẫn dùng như sau (thông số sự kiện dưới đây là cơ bản, chưa cộng thẻ):

- Giữ game hiển thị: sau 180–300 giây chơi chủ động sẽ có mưa vàng trong vùng **Bầu trời xu vàng**. Chạm các xu để kiếm Gold; mỗi đợt có 10 xu, mỗi xu thường cho 1 Gold.
- Trong **SHOP → Vật phẩm**, đổi Gold lấy Turbo Mint (10), Power Tap (10), Golden Magnet (15), Time Warp 1h (40). Mở **Kho tăng tốc**, chọn vật phẩm, xem trước rồi xác nhận dùng.
- Turbo Mint ×2 CPS trong 60 giây; Power Tap ×3 sức nhấn trong 30 giây; Magnet thu hộ xu vàng trong 30 giây; Time Warp cho Coin bằng 1 giờ CPS thường trực, không nhân booster/Frenzy.
- Khi tổng sản xuất đạt 10.000 Coin, bắt đầu thời gian chờ cầu vồng 600–900 giây chơi chủ động. Chạm xu cầu vồng trong 8 giây để nhận Frenzy 20 giây: ×3 CPS/click và ×2 Gold. Frenzy nhân với booster khác nhóm; trần hiệu ứng tạm thời là ×20 mỗi chỉ số.
- Booster hết hạn theo thời gian thực, kể cả khi chuyển nền. Chuyển nền/đóng game bỏ các xu chưa thu và tạm dừng thời gian chờ sự kiện. Giảm chuyển động giữ nguyên các nút thu xu.

## Mở game

Máy cần Node.js 22.12+; dự án đã kiểm tra với Node.js 24.14.0 và npm 11.9.0.

Lần đầu cài hoặc sau khi lấy mã nguồn:

```powershell
cd 'D:\Coin Clicker'
npm.cmd ci
npm.cmd run build
npm.cmd start
```

Trình duyệt mở tại **http://127.0.0.1:5173**. Giữ cửa sổ lệnh đang chạy; nhấn Ctrl+C khi muốn dừng. Sau khi đã build có thể nhấp đúp `Mo-Coin-Clicker.cmd`. Launcher dùng máy chủ file Node.js chỉ lắng nghe 127.0.0.1, không cần npm/thư viện khi đã có `dist`. Trong mã nguồn, launcher cài thư viện/build nếu chưa có bản build. Khi cùng bản game đã chạy ở cổng 5173, launcher mở lại trang game hiện có. Nếu cổng thuộc ứng dụng khác, launcher báo lỗi; không tự đổi cổng hoặc dừng ứng dụng khác.

Khi đang sửa mã:

```powershell
npm.cmd run dev
```

Sau khi sửa, chạy lại `npm.cmd run build` để cập nhật bản mở bằng launcher. Dev và bản build dùng chung cổng 5173, chỉ chạy một chế độ cùng lúc. Nếu cổng đang bận, dừng phiên Coin Clicker cũ thay vì tự đổi port. Không cần mở router, cài backend hoặc kết nối mạng để chơi bản build đã có; cài thư viện lần đầu cần mạng.

**Không mở `index.html` bằng nhấp đúp.** Ứng dụng cần được phục vụ qua địa chỉ local trên. Font, icon và ảnh đều nằm trong bản build, không tải từ CDN.

## Kiểm tra dự án

```powershell
npm.cmd run check
npm.cmd run build
```

| Lệnh                           | Kiểm tra                                                   |
| ------------------------------ | ---------------------------------------------------------- |
| `npm.cmd run typecheck`        | Kiểu TypeScript nghiêm ngặt                                |
| `npm.cmd run lint`             | Quy tắc code, import sai tầng và vòng phụ thuộc            |
| `npm.cmd run validate:content` | Giá, ID, tên, icon, tham chiếu và điều kiện mở khóa        |
| `npm.cmd test`                 | Test catalog, Amount, engine, save và UI nạp lại           |
| `npm.cmd run format`           | Định dạng mã và tài liệu                                   |
| `npm.cmd run format:check`     | Kiểm tra định dạng, không sửa file                         |
| `npm.cmd run simulate`         | Mô phỏng ba lịch chơi, ba seed, tới 30 ngày; chạy vài phút |
| `npm.cmd run audit:economy`    | Nguồn vật phẩm và giới hạn hoàn Gold của rương             |
| `npm.cmd run benchmark`        | Tải lõi tương đương hai giờ; không thay số đo trình duyệt  |

Sau khi build, đóng gói bằng `powershell -NoProfile -File scripts/package-local.ps1`. ZIP và SHA-256 nằm trong `releases/`; đây là file game, không chứa save trình duyệt. Xem trước bản build bằng `node scripts/serve-local.mjs` nếu không muốn tự mở trình duyệt.

## Tìm đúng nơi sửa

| Muốn sửa                    | Nơi mở                                                                                                             |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Bố cục màn chính            | `src/app/App.tsx`, `src/app/app.css`                                                                               |
| Hình đồng xu                | `src/assets/images/coins/coin-silver-star.svg`                                                                     |
| Phản hồi chạm               | `src/features/clicker/`                                                                                            |
| Máy/nâng cấp                | `src/content/generators.json`, `upgrades.json`                                                                     |
| Giá mua nhiều/Max           | `src/core/shop/calculate-price.ts`                                                                                 |
| Auto click, chọn mua/thẻ    | `src/core/automation/`, `src/features/automation/`                                                                 |
| Tính offline nền            | `src/platform/time/settle-offline-async.ts`, `offline-worker.ts`                                                   |
| Quy tắc offline             | `src/core/offline/settle-offline.ts`                                                                               |
| Booster và thời lượng       | `src/content/boosters.json`, `src/core/boosters/`                                                                  |
| Tần suất mưa/cầu vồng       | `src/content/events.json`, `src/core/events/`                                                                      |
| Giá đổi Gold                | `src/content/item-offers.json`                                                                                     |
| Thẻ, cấp và tổ hợp          | `src/content/cards.json`, `card-progression.json`, `card-synergies.json`                                           |
| Rương, chìa, tỷ lệ rơi      | `src/content/chests.json`, `keys.json`, `loot-tables.json`                                                         |
| Mốc rương miễn phí/ô thứ ba | `src/content/unlocks.json`                                                                                         |
| Quà ngày và thành tích      | `src/content/daily-rewards.json`, `achievements.json`; `src/core/daily-rewards`, `achievements`                    |
| Nguồn thu và mốc dài hạn    | `src/core/progression/`, `src/content/balance.json`; `src/features/statistics/`                                    |
| Reset và backup trước reset | `src/app/game-session.ts`, `src/platform/storage/indexed-db-repository.ts`; `src/features/settings/ResetPanel.tsx` |
| Luật và giao diện sưu tập   | `src/core/cards`, `core/chests`, `core/rewards`; `src/features/cards`, `features/chests`                           |
| Luật cộng dồn và hết hạn    | `src/core/effects/`                                                                                                |
| Quy tắc dữ liệu             | `src/content/schemas/catalog.schema.ts`                                                                            |
| Chữ hiển thị                | `src/locales/vi.json`                                                                                              |
| Màu/font/khoảng cách        | `src/ui/styles/tokens.css` và CSS tính năng                                                                        |
| Hợp đồng state/engine       | `src/core/state/`, `src/core/engine/`                                                                              |
| Quy tắc phụ thuộc           | `scripts/check-architecture.ts`                                                                                    |

Lõi không import React/DOM; UI không tự tính giá hoặc cộng tiền. `app/bootstrap.ts` nạp catalog, lấy khóa một tab, đọc save rồi tạo engine. UI gửi command; engine phát snapshot bất biến; `game-session.ts` điều phối ghi save tuần tự. Xem bản đồ file mới ở `docs/02-architecture.md`.

## Tiến trình được lưu ở đâu?

- IndexedDB của **http://127.0.0.1:5173**, trong hồ sơ trình duyệt đang chơi. Luôn mở lại đúng địa chỉ và cùng hồ sơ Chrome/Edge; `localhost`, port khác và trình duyệt khác có kho riêng.
- Chờ **Đã lưu trên máy** trước khi đóng. Trạng thái này chỉ xuất hiện sau khi giao dịch ghi hoàn tất. Ghi khi đóng tab chỉ là cố gắng bổ sung; đóng cưỡng bức giữa lúc ghi có thể mất phần chưa lưu.
- Chỉ một tab được chơi tại một thời điểm. Tab thứ hai báo đang mở ở nơi khác; đóng tab cũ rồi bấm Thử lại.
- Khi bản chính hỏng, game dùng bản dự phòng hợp lệ gần nhất và giữ bản lỗi để xuất kiểm tra. Nếu cả ba bản tự động hỏng, màn lỗi cho xem bản trước reset hoặc chọn file JSON đã xuất, rồi xác nhận để phục hồi. Save thuộc phiên bản mới hơn không bị tự hạ cấp hoặc ghi trắng.
- Vào **Thêm → Sao lưu → Xuất file save** để giữ bản bên ngoài trình duyệt; cũng có đường vào từ Cài đặt. Nhập file có bước xem trước và xác nhận; tiến trình hiện tại được sao lưu trước khi thay. File nhập không cộng thêm thưởng offline.
- Không xóa dữ liệu website hoặc chơi trong cửa sổ ẩn danh nếu muốn giữ lâu dài. Hai backup trong trình duyệt không thay thế file xuất riêng. Chạy build/cập nhật mã không xóa IndexedDB.
- Khi lưu lỗi, tiến trình mới vẫn ở bộ nhớ phiên. Bấm Thử lại và chờ thành công trước khi đóng.

Khi quyết toán offline, game ghi số dư và mốc thời gian cùng một giao dịch rồi mới cho chơi tiếp. Nếu ghi lỗi, game tạm dừng để thử lại hoặc xuất trạng thái hiện có. Đóng hộp thông báo offline không cộng thưởng lần nữa. Đồng hồ lùi không nhận thưởng khoảng đó và không kéo mốc đã lưu về trước.

## Tài liệu

- [Auto, offline 24h và các điểm mở rộng](docs/14-automation.md)

- [Chi tiết giai đoạn 7 và phần còn cần chơi thử](docs/12-stage-7.md)
- [Kết quả cân bằng trước/sau](docs/balance/REPORT.md)

- [Chi tiết giai đoạn 6: thưởng ngày, thành tích, reset](docs/11-stage-6.md)
- [Lộ trình đầy đủ](COIN_CLICKER_ROADMAP.md)
- [Quyết định chạy local](docs/decisions/0001-platform.md)
- [Kiến trúc và ranh giới module](docs/02-architecture.md)
- [Hợp đồng lưu tiến trình](docs/04-save-format.md)
- [Quy chuẩn hình ảnh](docs/05-art-ui-guide.md)
- [Kiểm tra và cập nhật](docs/06-testing-release.md)
- [Task và phạm vi các tính năng](docs/07-feature-traceability.md)
- [Chi tiết giai đoạn 3 và cách mở rộng](docs/08-stage-3.md)
- [Chi tiết giai đoạn 4: tăng tốc và sự kiện](docs/09-stage-4.md)
- [Chi tiết giai đoạn 5: thẻ, tổ hợp và rương](docs/10-stage-5.md)

Ảnh xu hiện là **SVG tạm được dựng mới theo mô tả hình tham chiếu**, chưa phải ảnh gốc đã tách nền. Âm chạm được tổng hợp tại máy; rung tùy hỗ trợ của thiết bị/trình duyệt. Kiểm thử tự động không thay thế việc xác minh hình ảnh, âm thanh và cảm ứng trên thiết bị thật; xem báo cáo kiểm tra.
