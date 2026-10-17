# Lưu tiến trình — schema 8, app 1.8.0-rc.1

`GameState` chứa ví Coin/Gold, số máy theo ID, ID nâng cấp đã mua, thống kê, runId, revision, `lastSimulatedAtUtc` và `offlineCps`. Tiền là chuỗi thập phân. `offlineCps` là snapshot của sản lượng thường trực khi dừng, dùng cho khoảng vắng mặt; CPS hiện tại vẫn suy ra từ catalog và sở hữu. Không lưu React state, modal hay tùy chọn hiển thị vào gameplay save.

Schema 3 bổ sung `inventory` theo ID (0–9.999/loại), `effects`, `effectsAtMs` và `events`. Effect có nguồn, target, operation, nhóm, hệ số, thời điểm bắt đầu/hết hạn và luật nối thời gian. Event state chứa thời gian chủ động, trạng thái RNG 32 bit, sequence ID, mốc đợt mưa/cầu vồng tiếp theo, mốc kết thúc mưa và các vật thể còn lại. Gold là số nguyên dạng chuỗi.

Schema 4 thêm `cards.owned` (cấp, bản trùng, Gold đã chuyển của từng thẻ), `cards.equipped`, `chests` (RNG riêng, số lần mở, mốc nhận rương, kết quả gần nhất và cờ đã xem), `statistics.totalGiftCoin` và snapshot `offlineEfficiency`. Receipt rương gồm ID tuần tự, chestId, UTC, thưởng đã áp dụng và chú thích mới/trùng/chuyển Gold.

Schema 5 thêm `daily` (claimCount, lastClaimDay, highestDay), `achievements` (unlockedIds, claimedIds) và `tracking` (Coin theo bảy nguồn, Gold sự kiện, số xu mưa/cầu vồng/booster, activeMs). Ngày dùng ordinal UTC+7; claim chưa nhận không tự cấp thưởng. Nguồn thu chưa biết của save cũ được tính bằng tổng lịch sử trừ nguồn đã theo dõi.

Schema 6 thêm `offlineClickPower` và `automation` (upgradeEnabled, clickRemainderMs 0–99, automaticClicks, actions, lastAction). Auto click và thu Gold là luật luôn bật; chỉ lưu bật/tắt auto mua. Save cũ có auto mua tắt và offlineClickPower = 0 trong lần quyết toán đầu để không cấp bù auto click cho thời gian trước cập nhật. Sau đó snapshot chuyển về sức nhấn hiện tại.

Schema 7 thêm `itemHistory`: mốc `sinceUtc`, cờ lịch sử đầy đủ `complete` và `entries` theo ID vật phẩm/thẻ. Mỗi mục lưu tồn đầu `opening`, số nhận `earned` theo nguồn và số tiêu `spent` theo cách dùng. Số lượng là số nguyên an toàn; từng mục phải thỏa `opening + earned − spent = hiện có`. Thẻ tính theo số bản, không theo cấp. Ghi lịch sử cùng giao dịch thay đổi kho; không ghi từ UI. Xem [quy tắc thống kê vật phẩm](15-item-statistics.md).

Schema 8 thêm `automation.autoEquipEnabled`. Cờ này mặc định true cho save mới và khi chuyển schema 1–7, giữ hành vi tối ưu cũ. Thêm/tháo thẻ thành công đặt false trong cùng giao dịch, không đổi `upgradeEnabled`; lệnh `SetAutoEquip` bật/tắt quyền đổi thẻ riêng. Cả mô phỏng online và offline tôn trọng cờ này.

Envelope hiện gồm `schemaVersion: 8`, `contentVersion: 0.7.0`, `appVersion: 1.8.0-rc.1`, UTC lưu, checksum và payload. SHA-256 tính trên envelope bỏ trường checksum, JSON chuẩn hóa key theo alphabet, UTF-8, giữ thứ tự mảng. Checksum phát hiện hỏng/sửa nhầm, không nhằm chống người chơi chỉnh game của mình.

P6 chỉ mở rộng catalog, không đổi cấu trúc payload. Save schema 5/catalog 0.5.0 được xác minh checksum cũ rồi tạo envelope/checksum catalog 0.6.0. Giữ nguyên ví, sở hữu, daily, claim thành tích, RNG, receipt và nguồn thu. Các ID/hiệu ứng cũ không bị đổi; snapshot offline vẫn dùng mức đã lưu cho khoảng vắng trước cập nhật. Codec tiếp tục chặn catalog/schema tương lai chưa biết. `shared/version.ts` là nguồn phiên bản app cho UI và save.

## Kho trên trình duyệt

IndexedDB `coin-clicker`, database version **1**, object store `saves`. Database version khác schema payload; không cần đổi cấu trúc object store ở lần nâng cấp này.

| Key            | Nội dung                                                              |
| -------------- | --------------------------------------------------------------------- |
| `primary`      | Tiến trình được ghi gần nhất                                          |
| `backup-1`     | Bản hợp lệ ngay trước lần ghi/khôi phục                               |
| `backup-2`     | Bản hợp lệ trước đó                                                   |
| `damaged`      | Bản chính lỗi được giữ lại để export kiểm tra                         |
| `reset-backup` | Snapshot mới nhất ngay trước reset gần nhất; không xoay theo autosave |

Lần lưu đầu tạo các bản dự phòng bằng cùng trạng thái khởi đầu; các lần sau luân phiên theo thứ tự commit. Backup không được sắp theo đồng hồ máy vì đồng hồ có thể lùi. Mọi record mới đều qua codec trước khi ghi. Khi đọc, ưu tiên primary, rồi backup-1 và backup-2 nếu primary hỏng. Không fallback âm thầm nếu bản chính thuộc schema/catalog mới hơn chưa hỗ trợ.

Một Web Lock `coin-clicker-save-writer` giữ từ trước đọc đến lúc đóng tab. Adapter kiểm tra lại primary bên trong transaction ghi để từ chối writer đang cầm bản cũ; revision giảm hoặc runId đổi chỉ được phép qua đường thay thế có backup. Lưu, luân phiên backup và giữ bản lỗi cùng một transaction; chỉ báo thành công ở `transaction.oncomplete`.

## Kiểm tra và migration

Codec kiểm tra schema nghiêm ngặt, checksum, miền Amount, counter, số máy tối đa 5.000/loại, ID hợp lệ, điều kiện nâng cấp và sổ Coin: `wallet + totalSpent = totalProduced + totalGift + initialCoin`. Mỗi trường vẫn giới hạn 10^100; phép đối chiếu cho phép tổng hai vế vượt trần của từng trường. Coin rương đi vào totalGift; không tăng mốc sản xuất. Kiểm tra thêm cấp thẻ, ô mở khóa, ID trang bị độc nhất/đã sở hữu, chuyển bản max, receipt và seed rương.

Save schema 1/catalog 0.1.0, schema 2/catalog 0.2.0, schema 3/catalog 0.3.0 và schema 4/catalog 0.4.0 được xác minh checksum **trước** migration. Giữ ví, sở hữu, thống kê và runId; schema 1 bổ sung offlineCps theo hai máy P1, schema 2–4 giữ offlineCps đã lưu. Chỉ schema 1/2 được thêm kho/effect rỗng và lịch mưa khởi đầu; schema 3/4 giữ nguyên kho, effect và RNG sự kiện. Schema 1–3 thêm thẻ rỗng, seed rương từ runId với hậu tố `:chests`, hiệu suất offline 0,5, totalGift=0 và mốc rương chưa nhận; schema 4 giữ toàn bộ thẻ/rương/receipt/hiệu suất cũ.

Các bản 1–4 thêm tracking bằng 0, daily chưa nhận với highestDay theo checkpoint, và mở khóa các thành tích suy ra được từ thống kê/sở hữu. Không tự tặng quà, không đoán lịch sử Gold/sự kiện. Schema 1–5 thêm trường automation với mặc định tắt và offlineClickPower = 0; schema 5 giữ nguyên lịch sử daily, achievement và tracking. Schema 6 giữ nguyên automation. Bản 1–6 thêm `itemHistory` với `complete=false`, tồn đầu bằng số đang sở hữu, số nhận/tiêu mới bằng 0 và mốc bằng checkpoint save cũ. Không suy đoán tổng lịch sử từng món. Sau đó tạo envelope/checksum schema 8/catalog 0.7.0. Boot ghi bản đã migrate/quyết toán trước khi mở UI. Fixture cố định:

- `tests/fixtures/saves/v1.json`: 100 Coin, 100 click, chưa có máy.
- `tests/fixtures/saves/v2.json`: số dư có phần lẻ, ba máy, hai nâng cấp và offlineCps 2,4.
- `tests/fixtures/saves/v3.json`: kho vật phẩm, Turbo còn hạn, RNG và đợt mưa đã thu một xu.
- `tests/fixtures/saves/v4.json`: hai thẻ trang bị với tổ hợp, thẻ max, kho rương/chìa và kết quả rương vàng chưa xem.
- `tests/fixtures/saves/v5.json`: giữ sưu tập/receipt v4, có daily đã nhận, thành tích click đã claim, nguồn click mới và phần lịch sử chưa phân loại.
- `tests/fixtures/saves/v6.json`: giữ các hệ thống trên, thêm automation và snapshot auto click.
- `tests/fixtures/saves/v7.json`: giữ tài nguyên v6 và thêm tồn đầu lịch sử vật phẩm chưa đầy đủ.

Codec mới kiểm tra ngày/count nhất quán, ID thành tích hợp lệ/không trùng, claimed là tập con của unlocked; tổng nguồn không vượt tổng sản xuất/quà; Gold sự kiện nguyên và counter không vượt số nguyên an toàn. Không bắt điều kiện hiện tại phải khớp toàn bộ unlocked vì trạng thái đã mở được giữ lâu dài.

Đây là dữ liệu kiểm thử, không phải save của người chơi.

## Ghi, offline và import

Click/mua yêu cầu lưu ngay; timer mỗi 10 giây; khi ẩn tab cũng yêu cầu lưu. Hàng đợi gộp yêu cầu và không ghi lại revision đã commit. Pause cập nhật checkpoint ngay cả khi không có thu nhập. Autosave không tranh quyền với quyết toán offline/import.

Đổi Gold lấy vật phẩm, dùng booster/Time Warp và thu xu thủ công dùng `commitCommand`: tạo snapshot dự kiến riêng, ghi xong mới cập nhật UI. Inventory, phần thưởng, effect và ID đã thu nằm trong cùng payload. Nếu ghi lỗi, không tiêu hao hoặc cấp thưởng. Bật/tắt auto mua cũng dùng commitCommand và chỉ đổi sau khi lưu thành công. Auto Gold và auto mua xử lý trong tick, loại ID cùng lúc cộng Gold rồi yêu cầu lưu ngay; đóng cưỡng bức trước commit vẫn có thể mất phần vừa thu như sản lượng chưa lưu.

Codec kiểm tra Gold nguyên, item ID/count, RNG, timer, ID vật thể trùng và effect đúng nguồn/nhóm/hệ số/thời lượng catalog. Ẩn tab và quyết toán giữ các Gold đã hẹn giờ để tiếp tục tự thu đúng một lần; chỉ bỏ cầu vồng chưa thu. Đồng hồ sự kiện chạy cả offline, còn tracking.activeMs chỉ đếm thời gian chơi. Hiệu ứng đang có áp dụng đến đúng lúc hết hạn khi mô phỏng offline, không tự dùng thêm vật phẩm. Import không bắt đầu lại thời lượng booster đã hết.

Trang bị/tháo/nâng thẻ, nhận rương mốc, mở rương và xác nhận đã xem đều dùng `commitCommand`. Mở rương lưu tiêu hao, RNG, phần thưởng và receipt trong cùng payload. Tải lại khi `acknowledged=false` hiện lại receipt đã lưu, không gọi grant lần nữa; chặn mở rương tiếp theo. Seed rương độc lập seed sự kiện. Bản trùng cấp 10 đổi Gold ngay; số dư bản trùng cấp max phải bằng 0.

Offline: mô phỏng `min(max(now − checkpoint, 0), 24 giờ)`, gồm sản xuất liên tục và click tại mốc 100 ms, nhân offlineEfficiency (mặc định 0,5 + thẻ, tối đa 1). Khi bật auto mua, chia tại thời điểm chờ đủ tiền, hết hiệu ứng và mở ô thẻ; sản lượng mới chỉ áp dụng sau giao dịch. Bộ thẻ được tối ưu theo thu nhập offline. Gold tự thu theo thời điểm spawn, không nhân hiệu suất Coin. Khoảng vượt 24 giờ bị bỏ bằng checkpoint mới. Ghi số dư và checkpoint nguyên tử trước khi phát state mới; lỗi ở resume tạm dừng cho retry. Clock lùi không hạ checkpoint. Snapshot ở trần số chỉ nhận phần tiền còn chứa được.

Export tạo JSON từ snapshot đang có, dùng được cả khi IndexedDB báo lỗi. Import giới hạn 2 MB và kiểm tra trước khi xem trước; xác nhận mới thực hiện backup snapshot đang chơi rồi thay primary. Thay thất bại không đổi state. Import không cộng thưởng offline từ file, settings vẫn giữ. Màn lỗi boot cho xuất dữ liệu còn đọc được và xem trước file khôi phục nếu không còn bản local hợp lệ; dữ liệu có phiên bản mới hơn không bị ghi đè. File lỗi xuất để kiểm tra không được mô tả là bản có thể import thành công.

Daily và thành tích cũng đi qua `commitCommand`: ngày/cờ nhận và toàn bộ phần thưởng được ghi cùng payload. Lỗi ghi/kho đầy không mất lượt nhận. Countdown chỉ hiển thị; quyền nhận được lõi kiểm tra lại bằng Clock khi bấm.

## Reset lượt chơi

`session.reset('RESET', expectedRunId)` kiểm tra preview còn đúng lượt, khóa thao tác, dừng tick và chờ hàng đợi lưu. Tạo backup từ snapshot mới nhất trong RAM, kể cả phần chưa autosave. `repository.reset` xác minh revision/runId so với bản lưu hiện tại; một transaction ghi backup cũ vào `reset-backup` và lượt mới vào primary, backup-1, backup-2. Chỉ sau commit mới thay engine. Nếu abort, không thay các record hoặc lượt chơi; có thể thử lại.

`reset-backup` không xoay theo autosave và chỉ bị thay ở reset tiếp theo. Loader không dùng key này tự động; do vậy primary mới hỏng không làm sống lại lượt cũ. Có thể xem trước và xác nhận khôi phục trong Sao lưu; khi cả ba bản tự động hỏng, màn lỗi có nút **Xem bản trước reset**. Chỉ xem không ghi gì. Dữ liệu phiên bản tương lai vẫn chặn thay thế. Muốn giữ nhiều lượt cũ, xuất JSON trước reset.

Đóng tiến trình cưỡng bức trong lúc ghi có thể mất phần chưa commit. Chờ **Đã lưu trên máy** trước khi đóng, và xuất file riêng để bảo vệ trước việc xóa dữ liệu trình duyệt. Hai backup local không phải cloud.

## Settings

`localStorage['coin-clicker-settings-v1']` giữ giảm chuyển động/ánh sáng/âm/rung. Lỗi đọc dùng mặc định, lỗi ghi báo trong màn settings; không ảnh hưởng phép tính hoặc save gameplay. Reset lượt chơi giữ nguyên các cài đặt này.
