# Kiến trúc Coin Clicker

## Trách nhiệm của từng phần

| Thư mục    | Trách nhiệm                                | Được phụ thuộc                                              |
| ---------- | ------------------------------------------ | ----------------------------------------------------------- |
| `app`      | Khởi động, ghép màn hình và truyền dữ liệu | Các tầng trong ứng dụng                                     |
| `core`     | Types và luật gameplay thuần               | `core`, `shared`                                            |
| `content`  | Catalog và schema đầu vào                  | `content`, types từ `core`, `shared`                        |
| `features` | UI clicker/shop/settings/offline           | `core` types/selectors, `ui`, `shared`, `assets`, `locales` |
| `ui`       | Thành phần và bố cục tái sử dụng           | `ui`, `shared`, `assets`, `locales`                         |
| `platform` | Lưu trữ và API môi trường                  | `platform`, `core`, `shared`                                |
| `shared`   | Kiểu Amount/Result nhỏ gọn                 | Chính nó                                                    |

`main.tsx` là điểm nối bên ngoài các tầng, chỉ khởi tạo ứng dụng. `npm run lint` chạy cả ESLint và script phân tích import bằng TypeScript resolver, hỗ trợ alias lẫn đường dẫn tương đối, phát hiện vòng import. File mới trong `src` phải thuộc một tầng; ngoại lệ duy nhất là `main.tsx`.

## Luồng hiện tại

`main -> bootstrapGame -> validateCatalog -> acquireTabLock -> load/migrate/recover -> settleOffline + commit -> createEngine -> createGameSession -> App`.

Chạm xu gửi `ClickCoin`; mua gửi `PurchaseGenerator` hoặc `PurchaseUpgrade`. Engine cập nhật ví, sở hữu và thống kê trong một snapshot bất biến rồi thông báo store. `useSyncExternalStore` nối snapshot với React. UI dùng quote/selectors của lõi, không tự tính tiền. Hiệu ứng chạm chỉ chạy khi command thành công. Settings lưu riêng qua adapter; không thuộc GameState.

## Bản đồ phần mới ở giai đoạn 2

`UI -> command -> engine -> next state/events -> store -> selectors/UI`.

| Muốn sửa                                   | File chịu trách nhiệm                                                  |
| ------------------------------------------ | ---------------------------------------------------------------------- |
| Phạm vi số, phép tính, định dạng hiển thị  | `src/shared/amount.ts`                                                 |
| Thưởng mỗi click, thống kê click           | `src/core/clicking/apply-click.ts`                                     |
| CPS, sức nhấn và thứ tự cộng/nhân nâng cấp | `src/core/economy/selectors.ts`                                        |
| Command, tick, pause/resume, snapshot      | `src/core/engine/create-engine.ts`                                     |
| Nối snapshot vào React                     | `src/app/game-store.ts`                                                |
| Timer, ẩn/hiện tab, autosave và gửi click  | `src/app/use-game-lifecycle.ts`                                        |
| Hàng đợi lưu và trạng thái lưu             | `src/app/game-session.ts`                                              |
| Mã hóa, checksum và kiểm tra save          | `src/platform/storage/save-codec.ts`                                   |
| Giao dịch đọc/ghi IndexedDB                | `src/platform/storage/indexed-db-repository.ts`                        |
| Khóa một tab ghi                           | `src/platform/lifecycle/tab-lock.ts`                                   |
| Clock thực / Clock giả                     | `src/platform/time/browser-clock.ts` / `tests/helpers/game-fixture.ts` |
| Báo đang lưu/lỗi lưu và lỗi khởi động      | `src/ui/components/SaveIndicator.tsx` / `src/app/BootScreen.tsx`       |

Save đi qua `SaveRepository`. Clock được truyền vào engine; từ P3, RNG là xorshift32 có trạng thái lưu trong GameState, khởi tạo bằng runId. Không dùng Math.random trong render/scheduler, không để component gọi IndexedDB hoặc tự cộng thưởng. `shared/amount.ts` là nơi duy nhất trực tiếp dùng decimal.js.

Vòng tick chạy mỗi 100 ms nhưng tính sản lượng từ elapsed time đơn điệu (`performance.now()`), không theo số frame hay đồng hồ lịch. Engine giữ mốc nguyên millisecond, không đánh mất phần millisecond qua các callback. `engine.pause()` quyết toán phần đang chơi; `engine.resume()` chỉ đặt lại mốc. Từ P2, **session.resume** quyết toán offline và chờ commit rồi mới gọi engine.resume. UI gọi session, không bỏ qua hàng rào này bằng engine trực tiếp.

Snapshot cache ổn định đến khi state đổi, được đóng băng cả các nhánh gameplay. React StrictMode không khởi tạo hai engine hoặc ghi hai lần cho một click; bootstrap chạy bên ngoài cây React. Đọc save thất bại dừng khởi động, giải phóng kết nối/khóa và hiển thị lỗi.

## Quy ước số của P1

Tiền là chuỗi thập phân không âm, tối đa `10^100`, tối đa 18 chữ số thập phân; decimal.js dùng precision 120. Ví không đi qua `Number` hay `parseFloat`. Định dạng M/B/T/khoa học chỉ dành cho UI; tooltip giữ nguyên số đầy đủ. Counter và revision là số nguyên an toàn; thao tác vượt giới hạn bị từ chối, không thay state một phần.

Tham số catalog phải nằm cùng miền Amount. Số cực nhỏ hoặc tích hiệu ứng sinh quá 18 chữ số thập phân cũng bị từ chối, không làm tròn âm thầm. Giá máy P2 tính bằng phân số BigInt chính xác, làm tròn lên từng đơn vị; cache tổng tiền giúp tìm Max bằng tìm kiếm nhị phân. Giới hạn kỹ thuật 5.000 máy mỗi loại; với hệ số 1,15 hiện tại giá đã vượt miền Amount trước mốc đó. Tiền thường vẫn dùng decimal.js; không chuyển BigInt sang Number để thu tiền. Thời gian là millisecond nguyên; phần trăm cột mốc có thể dùng Number vì chỉ là hiển thị.

## Bản đồ bổ sung ở giai đoạn 3

| Muốn sửa                                   | File/module                                                                      |
| ------------------------------------------ | -------------------------------------------------------------------------------- |
| Giá từng máy, cộng giá ×10/×100, Max       | `core/shop/calculate-price.ts`                                                   |
| Điều kiện mua, báo giá, lợi ích/hoàn vốn   | `core/shop/quotes.ts`                                                            |
| Giao dịch trừ Coin và ghi sở hữu           | `core/shop/purchase.ts`                                                          |
| Thu nhập offline và chống nhận trùng       | `core/offline/settle-offline.ts`                                                 |
| Mốc tiến triển tiếp theo                   | `core/progression/milestone.ts`                                                  |
| Ghi offline/import trước khi tiếp tục chơi | `app/game-session.ts`                                                            |
| Khôi phục khi không vào được màn chính     | `app/recovery.ts`, `app/BootScreen.tsx`                                          |
| Cửa hàng thật                              | `features/shop/ShopPanel.tsx`                                                    |
| Xem trước import và danh sách backup       | `features/settings/SaveToolsPanel.tsx`                                           |
| Thông báo khoản offline đã commit          | `features/offline/OfflineNotice.tsx`                                             |
| Đọc/tải file JSON, giới hạn 2 MB           | `platform/storage/save-file.ts`, `save-codec.ts`                                 |
| 2 backup + bản lỗi + kiểm tra ghi cũ       | `platform/storage/indexed-db-repository.ts`                                      |
| Cài đặt riêng và phản hồi âm/rung          | `platform/storage/settings-repository.ts`, `platform/feedback/click-feedback.ts` |

Phần UI chỉ nhận callback cho đọc/xuất file và khôi phục; không import storage adapter. Session khóa thao tác và dừng tick trong khi chuyển dữ liệu; snapshot mới chỉ được phát sau khi ghi thành công. Hỏng một import không thay state đang chơi.

## Bản đồ bổ sung ở giai đoạn 4

| Muốn sửa                                | File/module                                                    |
| --------------------------------------- | -------------------------------------------------------------- |
| Danh mục booster và thời lượng          | `content/boosters.json`, `content/schemas/expansion.schema.ts` |
| Giá đổi Gold                            | `content/item-offers.json`, `core/shop/purchase-item.ts`       |
| Preview và tiêu thụ vật phẩm            | `core/boosters/use-booster.ts`                                 |
| Cộng/nhân theo nhóm và trần tạm thời    | `core/effects/pipeline.ts`, `effect.types.ts`                  |
| Tính CPS qua thời điểm hiệu ứng hết hạn | `core/effects/integrate-production.ts`                         |
| Ngẫu nhiên tái hiện được                | `core/events/random.ts`                                        |
| Spawn, đồng hồ chủ động, vị trí, Magnet | `core/events/scheduler.ts`, `content/events.json`              |
| Thu xu đúng một lần và bật Frenzy       | `core/events/collect-event.ts`                                 |
| Dọn xu khi chuyển nền, boot hoặc import | `core/events/end-active-session.ts`                            |
| Ghi nguyên tử trước khi hiện thưởng     | `app/game-session.ts → commitCommand`                          |
| Giao diện kho/timer/sự kiện             | `features/boosters/`, `features/events/`                       |
| Quầy Gold trong SHOP                    | `features/shop/ItemShop.tsx`                                   |
| Kiểm tra state mở rộng                  | `platform/storage/expansion-state.schema.ts`                   |

Các selector `productionPerSecond`/`clickPower` trả chỉ số thường trực; `activeProductionPerSecond`/`activeClickPower` thêm hiệu ứng tạm thời. Offline, Time Warp và báo giá hoàn vốn dùng chỉ số thường trực. UI không tự nhân bonus.

Command dùng vật phẩm/đổi Gold/thu xu thủ công phải qua `session.commitCommand`, không gọi `session.dispatch`. Session dừng mô phỏng, dựng kết quả riêng, đợi hàng đợi ghi, ghi toàn bộ state rồi mới công bố. Lỗi ghi giữ kết quả cũ. Magnet chạy trong tick; Gold và ID đã loại bỏ cùng một snapshot, yêu cầu autosave ngay khi thu.

`events.activeMs` chỉ tăng khi chơi; `effectsAtMs` tiến theo thời gian thực và không lùi. Vòng tick tách đoạn tại các mốc hiệu ứng/sự kiện. CSS không điều khiển RNG, thời hạn hay collider; collider là nút DOM trong vùng riêng, không phủ shop. Chi tiết quy tắc và giới hạn ở `09-stage-4.md`.

## Bản đồ bổ sung ở giai đoạn 5

| Muốn sửa                                     | File/module                                                                           |
| -------------------------------------------- | ------------------------------------------------------------------------------------- |
| Danh mục thẻ và hiệu ứng mỗi cấp             | `content/cards.json`, `core/cards/card.types.ts`                                      |
| Giá nâng, bản trùng, chuyển Gold khi max     | `content/card-progression.json`, `core/cards/commands.ts`                             |
| Tổ hợp, ô trang bị và mốc rương              | `content/card-synergies.json`, `content/unlocks.json`                                 |
| Bonus thường trực và cấu hình sự kiện có thẻ | `core/cards/selectors.ts`, `core/economy/selectors.ts`                                |
| Rương/chìa và trọng số                       | `content/chests.json`, `keys.json`, `loot-tables.json`                                |
| Cấp thưởng dùng chung                        | `core/rewards/reward.types.ts`, `grant-rewards.ts`                                    |
| Mở rương, seed, biên nhận và xác nhận        | `core/chests/commands.ts`, `loot.ts`, `chest.types.ts`                                |
| Danh mục inventory dùng chung cho shop/codec | `core/catalog/inventory.ts`                                                           |
| UI bộ sưu tập/preview/kết quả                | `features/cards/`, `features/chests/`                                                 |
| Schema catalog/save sưu tập                  | `content/schemas/collection.schema.ts`, `platform/storage/collection-state.schema.ts` |

Luật rương/thẻ tách khỏi renderer. `grantRewards` trả snapshot riêng và thưởng thực nhận; không tự ghi storage. `session.commitCommand` ghi snapshot trước khi UI nhận kết quả. RNG rương riêng, không ảnh hưởng lịch mưa/cầu vồng. `DurableAction` nằm trong hợp đồng lõi để các feature không phụ thuộc kiểu của một component khác. Chi tiết và giới hạn: `10-stage-5.md`.

## Bản đồ bổ sung ở giai đoạn 6

| Muốn sửa                                      | File/module                                                                             |
| --------------------------------------------- | --------------------------------------------------------------------------------------- |
| Quà ngày, mốc/quà thành tích                  | `content/daily-rewards.json`, `achievements.json`                                       |
| Ngày Việt Nam, countdown, claim               | `core/daily-rewards/`                                                                   |
| Đếm mốc, mở khóa và claim                     | `core/achievements/`                                                                    |
| Kiểu tiến trình, nguồn thu và refresh         | `core/progression/progression.types.ts`, `tracking.ts`, `refresh-progress.ts`           |
| Mốc dài hạn                                   | `content/balance.json` → `longTermMilestone`                                            |
| Màn thưởng ngày, thành tích và thống kê       | `features/daily-rewards/`, `achievements/`, `statistics/`                               |
| Hướng dẫn và preview reset                    | `features/help/`, `features/settings/ResetPanel.tsx`                                    |
| Reset nguyên tử và backup riêng               | `app/game-session.ts`, `platform/storage/indexed-db-repository.ts`                      |
| Xem/khôi phục backup trước reset khi boot lỗi | `app/recovery.ts`, `app/BootScreen.tsx`                                                 |
| Schema catalog/save mới                       | `content/schemas/progression.schema.ts`, `platform/storage/progression-state.schema.ts` |

`refreshProgress` chỉ mở khóa thành tích và ghi ngày cao nhất đã quan sát; không cấp quà. `ClaimDaily`/`ClaimAchievement` dùng `commitCommand` và bộ cấp thưởng chung; UI phát phản hồi sau commit. Bộ đếm nguồn thu được cập nhật ở chính nơi cộng tiền, không suy ra từ animation. `session.reset` điều phối storage rồi thay engine, không đặt luật reset trong component. Chi tiết: `11-stage-6.md`.

## Quy tắc thêm file

P6 bổ sung `scripts/simulation/` cho lịch chơi, chính sách mua và chạy mô phỏng; script này gọi engine thật, không nhét bot vào game. `scripts/simulate-economy.ts` và `summarize-economy.ts` ghi dữ liệu/báo cáo vào `docs/balance/`. `audit-economy.ts` kiểm tra dòng Gold; `benchmark-engine.ts` đo tải Node. `scripts/serve-local.mjs` chỉ phục vụ file `dist`, không chứa dữ liệu người chơi; `package-local.ps1` đóng gói bản chạy vào `releases/`. CSS/font nằm ở `ui/styles`, lọc cửa hàng ở `features/shop`; điều kiện mở khóa vẫn nằm ở `core/shop/quotes.ts`. Phiên bản app ở `shared/version.ts`, phiên bản catalog ở `content/balance.json`.

- Component dùng PascalCase; module nghiệp vụ dùng kebab-case.
- ID nội dung ổn định; tên hiển thị lấy từ `locales/vi.json`.
- Catalog hiện có 12 máy, 30 nâng cấp, 4 booster, 12 thẻ, 3 tổ hợp, 2 rương, 1 chìa, 7 quầy đổi, 2 loại sự kiện, 7 quà ngày và 30 thành tích. Chỉ tạo module khi có chức năng cụ thể cần triển khai.
- Tách file theo trách nhiệm. CSS có thể dài hơn file logic; ưu tiên tách theo tính năng, không chỉ theo số dòng.
- Unit test cạnh nghiệp vụ khi có implementation; test đầu vào/liên tính năng trong `tests/integration`.

Các hợp đồng chỉ chứa trường có mục đích ở giai đoạn đã triển khai. Inventory/effect được thêm ở P3; thẻ, rương và hiệu suất offline được thêm ở P4; daily/thành tích/nguồn thu được thêm ở P5 cùng migration.
