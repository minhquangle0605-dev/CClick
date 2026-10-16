# Giai đoạn 6 — thưởng ngày, thành tích và quản lý lượt chơi

Ngày 15/10/2026. Mã roadmap **P5**, app **0.6.0**, catalog **0.5.0**, save **schema 5**. Giữ game local cho một người; giai đoạn P6 về cân bằng và chơi thử chưa bắt đầu. Các nguồn quà đều nằm trong gameplay, không có tài khoản, quảng cáo hoặc giao dịch tiền thật.

## Thưởng ngày

Mở **Thưởng ngày** ở màn chính hoặc menu **Thêm**. Mỗi ngày nhận tối đa một phần; thứ tự phụ thuộc tổng số lần đã nhận, không phụ thuộc số ngày liên tiếp. Bỏ ngày không reset, không nhận bù các ngày vắng mặt. UI có countdown và hiển thị toàn bộ bảy phần quà.

| Lần trong vòng | Quà                       |
| -------------- | ------------------------- |
| 1              | 5 Gold                    |
| 2              | 1 Turbo Mint              |
| 3              | 1 rương bạc               |
| 4              | 1 Power Tap               |
| 5              | 1 Chìa sao                |
| 6              | 1 Time Warp 1h            |
| 7              | 1 rương vàng + 1 Chìa sao |

Phần quà kế tiếp là `(claimCount % 7) + 1`; sau lần 7, lần 8 nhận quà 1. Ngày Việt Nam tính bằng `floor((UTC_ms + 7 giờ) / 24 giờ)`, đổi lúc 00:00 UTC+7, không phụ thuộc múi giờ trình duyệt. State lưu day ordinal trong `lastClaimDay`, cùng `highestDay` và `claimCount`; timestamp của envelope vẫn là UTC.

Nếu ngày hiện tại sớm hơn ngày cao nhất đã ghi nhận, không cấp thưởng cho ngày lùi. Khi tới lại ngày hợp lệ, người chơi nhận tiếp nếu ngày đó chưa claim. Time Warp không thay đồng hồ này. Dùng giờ thiết bị, không đối chiếu máy chủ; đây không phải cơ chế chống người chơi chỉnh đồng hồ/save của chính mình.

`ClaimDaily` tạo bản dự kiến: cấp toàn bộ quà và cập nhật ngày/count cùng một payload. Chỉ sau commit mới phát snapshot và âm/rung. Lỗi ghi hoặc kho đầy giữ nguyên lượt nhận và tài nguyên; bấm lại được sau khi giải quyết lỗi. Nhận hai lần liên tiếp trong cùng ngày bị từ chối cả ở lõi.

## Thành tích

30 định nghĩa có ID ổn định trong `content/achievements.json`, chia thành các nhóm sau:

| Nhóm                           | Các mốc                              |
| ------------------------------ | ------------------------------------ |
| Lần chạm                       | 10, 100, 1.000, 10.000               |
| Tổng sản xuất                  | 10^3, 10^4, 10^6, 10^9, 10^12, 10^15 |
| Máy sở hữu                     | 1, 10, 50, 100                       |
| Nâng cấp mua                   | 1, 3, 6                              |
| Xu mưa thu được (kể cả Magnet) | 10, 100                              |
| Cầu vồng đã chạm               | 1, 10                                |
| Loại thẻ sở hữu                | 1, 6, 12                             |
| Rương đã mở                    | 1, 10, 50                            |
| Lần nhận thưởng ngày           | 1, 7, 30                             |

Hai danh sách `unlockedIds` và `claimedIds` tách biệt. Engine kiểm tra mốc sau các thay đổi gameplay và quyết toán offline; mở khóa không tự cấp quà. UI cho lọc tất cả/có thể nhận/chưa mở/đã nhận, hiển thị tiến độ và phần thưởng trước khi bấm. Badge trên nút màn chính là số thành tích chưa nhận có thể claim.

`ClaimAchievement` kiểm tra lại điều kiện/ID, cấp quà và ghi claim cùng giao dịch. Nhận lại hoặc nhận mục chưa mở đều bị từ chối. Quà hiện là Gold/rương/chìa, cấu hình riêng cho từng thành tích; thay đổi trong JSON không sửa phép cấp thưởng trong React. Kho đầy không làm mất phần quà chưa nhận.

Mốc đã đạt không mất khi tiêu tiền: tổng sản xuất không giảm. Quà Coin không tăng tổng sản xuất. Khi chuyển save cũ, các thành tích suy ra được từ click, tổng sản xuất, máy/nâng cấp, thẻ/rương sẽ mở; quà vẫn chờ người chơi bấm nhận. Lịch sử xu mưa/cầu vồng không được đoán lại từ số dư Gold.

## Thống kê và mốc dài hạn

**Thêm → Thống kê** hiển thị tổng sản xuất, tổng tiêu, tổng quà, click, CPS/sức nhấn thường trực, hiệu suất offline, thẻ/rương, lượt nhận ngày, Gold sự kiện, xu mưa, cầu vồng, booster và phút chơi chủ động từ bản cập nhật. `balance.longTermMilestone` đặt mục tiêu 10^15 Coin.

`tracking.coin` có bảy nguồn: `click`, `production`, `offline`, `timeWarp`, `chest`, `daily`, `achievement`. Đếm lượng thực được cộng, đã gồm hiệu ứng tương ứng; offline bị cap chỉ ghi phần thực nhận. Gold từ sự kiện được ghi riêng, không cộng Gold quà vào cùng cột.

Save cũ giữ nguyên tổng thu/chi. Các bộ đếm nguồn mới bắt đầu 0; phần chưa phân loại suy ra bằng tổng cũ trừ các nguồn đã biết. UI ghi rõ đây là lịch sử chưa phân loại. Codec từ chối nguồn âm, tràn và tổng nguồn lớn hơn tổng sản xuất/quà. Sổ Coin vẫn là `wallet + spent = produced + gift + initial`.

Không lưu bảng thống kê riêng của React. Selector đọc snapshot engine; số lớn vẫn qua Amount bằng chuỗi. Tổng thời gian/counter dùng số nguyên an toàn; chỉ định dạng phút/số lượng trên UI dùng Number.

## Reset và bản sao lưu riêng

Reset nằm trong **Cài đặt → Bắt đầu lượt chơi mới**, cách xa nút click/nhận thưởng. Màn preview liệt kê Coin/Gold, máy/nâng cấp, thẻ/kho, lịch thưởng ngày, thành tích và thống kê sẽ xóa; cần nhập đúng `RESET`. Có nút xuất JSON trước reset, không tự tải file khi người chơi chưa chọn.

Luồng xử lý:

1. Kiểm tra xác nhận và runId của preview còn khớp; khóa thao tác, dừng tick và đợi lần ghi đang chạy.
2. Tạo envelope của **snapshot mới nhất trong RAM**, gồm phần chưa autosave.
3. Tạo state ban đầu với runId mới, không thưởng tái sinh; daily của lượt mới bắt đầu lại từ lần 1.
4. Một transaction IndexedDB ghi snapshot cũ vào **`reset-backup`**, đồng thời ghi lượt mới vào primary và cả hai backup tự động.
5. Chỉ sau commit mới đổi engine/UI. Lỗi hoặc abort giữ state cũ, primary và backup cũ; có thể thử lại.

`reset-backup` có nhãn **Trước reset gần nhất** trong Sao lưu, không bị autosave xoay vòng. Reset kế tiếp thay bản này; muốn giữ nhiều lượt, xuất JSON riêng. Cài đặt ở localStorage không bị sửa hoặc xóa.

Loader tự động chỉ xét primary, backup-1, backup-2. Hai backup này được khởi tạo bằng lượt mới cùng lúc reset, nên ngay cả khi primary mới hỏng cũng không tự trở về lượt cũ. `reset-backup` chỉ được chọn qua Sao lưu → Xem trước → Xác nhận khôi phục. Nếu cả ba bản tự động đều hỏng, game báo lỗi thay vì tự khôi phục bản trước reset. Màn lỗi có nút **Xem bản trước reset**, đọc bản được giữ riêng rồi chờ người chơi xác nhận; cũng có thể dùng file đã xuất. Không mở đường thay thế này khi save thuộc phiên bản mới hơn chưa hỗ trợ.

Khôi phục thủ công/import phục hồi đúng lịch daily và trạng thái claim của bản đó; không cấp thêm offline từ file. Một game local vẫn cho chủ nhân chủ động quay lại save cũ, không áp dụng chính sách chống gian lận online.

## Giao diện và phản hồi

Menu **Thêm** gom thưởng ngày, thành tích, thống kê, sao lưu, hướng dẫn, cài đặt và lộ trình. Hướng dẫn có Coin/Gold/CPS, bonus thường trực/tạm thời, Frenzy, bản trùng và bản lưu. Màn reset giữ trong Cài đặt, không đặt cạnh quà ngày.

Âm nhận quà hai nốt và rung ngắn chạy sau claim/mở rương thành công, dùng cài đặt âm/rung hiện có. Lỗi audio hoặc thiết bị không hỗ trợ không thay kết quả gameplay. Daily/thành tích dùng nút HTML và progress có nhãn, bố cục co giãn; không thêm animation bắt buộc. Chế độ giảm chuyển động của các phần cũ được giữ.

## Bản đồ file

| Muốn sửa                                | Nơi sửa                                                                        |
| --------------------------------------- | ------------------------------------------------------------------------------ |
| Quà bảy lần nhận                        | `src/content/daily-rewards.json`                                               |
| ID/mốc/quà thành tích                   | `src/content/achievements.json`                                                |
| Mốc 10^15                               | `src/content/balance.json` → longTermMilestone                                 |
| Ngày Việt Nam, countdown, claim         | `src/core/daily-rewards/`                                                      |
| Điều kiện/mở khóa/claim thành tích      | `src/core/achievements/`                                                       |
| Kiểu state, nguồn thu, refresh          | `src/core/progression/`                                                        |
| Cấp quà dùng chung                      | `src/core/rewards/grant-rewards.ts`                                            |
| Nhãn quà dùng ở daily/thành tích/rương  | `src/features/rewards/reward-label.ts`                                         |
| Tính thống kê các nguồn                 | `core/clicking`, `core/engine`, `core/offline`, `core/boosters`, `core/events` |
| Schema catalog mới                      | `src/content/schemas/progression.schema.ts`                                    |
| Schema save mới và migration            | `src/platform/storage/progression-state.schema.ts`, `save-codec.ts`            |
| Giao dịch reset/backup riêng            | `src/app/game-session.ts`, `src/platform/storage/indexed-db-repository.ts`     |
| Màn daily/thành tích/thống kê/hướng dẫn | `src/features/daily-rewards`, `achievements`, `statistics`, `help`             |
| Preview/xác nhận reset                  | `src/features/settings/ResetPanel.tsx`                                         |
| Âm/rung và ngôn ngữ                     | `src/platform/feedback/click-feedback.ts`, `src/locales/vi.json`               |

Schema 5 chuyển trực tiếp được save 1–4. Fixture v1–v4 giữ nguyên; v5 bổ sung daily đã nhận, achievement đã claim, nguồn click mới và lịch sử chưa phân loại. Khi thêm mục tiêu/phần thưởng, giữ ID và chạy validator; đổi cấu trúc save phải có migration. Không dùng animation hoặc state component làm bằng chứng đã phát quà.

## Kiểm tra và giới hạn

Đã có kiểm thử qua ngày Việt Nam ở cuối tháng/năm/ngày nhuận, bỏ ngày, vòng thứ 8, lùi ngày, Time Warp không đổi ngày, kho đầy, claim lặp, ghi chậm/lỗi và reload. Reset được thử transaction abort, giữ settings, giữ phần chưa autosave, lượt chơi chạm giới hạn số, backup không xoay vòng, không tự hồi lượt cũ khi primary hỏng, và khôi phục có chủ đích. Có luồng UI React/jsdom cho claim, thống kê, countdown, xác nhận reset và xem/khôi phục backup từ màn lỗi boot.

Công cụ trình duyệt trả `apps: []`, `browsers: []`. Chưa xác minh trực quan desktop/360 px, âm/rung, bàn phím/cảm ứng trên thiết bị thật hoặc chơi dài để cân bằng. Ghi kết quả lệnh thực tế trong `06-testing-release.md`; không coi kiểm thử mô phỏng là đã hoàn tất phần chơi thử của P6.
