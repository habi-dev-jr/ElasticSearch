# Giai đoạn 6 — Tích hợp Node.js

> 🏗️ Khung bài học. Nội dung chi tiết + code mẫu sẽ được bổ sung khi bạn học tới đây.
> Dùng client `@opensearch-project/opensearch` (xem [`client/connect.js`](../../client/connect.js)).

## Sẽ học
- Tổ chức một **search service** tái sử dụng
- CRUD + **bulk indexing** có xử lý lỗi (kiểm tra `response.errors`)
- Xây **API tìm kiếm sản phẩm** nhỏ: search + filter giá + facet theo category/brand
- Phân trang & chuẩn hoá kết quả trả về cho frontend
- Best practices: retry, bulk helper, connection pooling, không hardcode credential

## Đã có sẵn để tham khảo
- [`client/connect.js`](../../client/connect.js) — module kết nối
- [`client/ping.js`](../../client/ping.js) — kiểm tra kết nối
- [`datasets/seed-products.js`](../../datasets/seed-products.js) — ví dụ tạo index + `_bulk` trong code

## ✅ Checklist: xem [ROADMAP.md](../../ROADMAP.md#-giai-đoạn-6--tích-hợp-nodejs)

➡️ Tiếp theo: [Giai đoạn 7 — Vận hành & Nâng cao](../07-van-hanh-nang-cao/README.md)
