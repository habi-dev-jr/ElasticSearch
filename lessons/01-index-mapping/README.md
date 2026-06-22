# Giai đoạn 1 — Index & Mapping

> Mục tiêu: làm chủ CRUD document, hiểu mapping & data types, nạp dữ liệu hàng loạt bằng `_bulk`.

## 1. Index là gì?

Index là nơi chứa các document cùng loại. Khi tạo index bạn có thể khai báo:
- **settings**: số shard, replica, refresh interval...
- **mappings**: định nghĩa các field và kiểu dữ liệu (giống schema).

## 2. CRUD document

| Thao tác | HTTP | Ý nghĩa |
|---|---|---|
| Create/Index | `PUT /idx/_doc/<id>` hoặc `POST /idx/_doc` | Tạo hoặc ghi đè document |
| Read | `GET /idx/_doc/<id>` | Lấy document theo id |
| Update | `POST /idx/_update/<id>` | Cập nhật một phần (partial update) |
| Delete | `DELETE /idx/_doc/<id>` | Xoá document |

Mỗi document có metadata: `_index`, `_id`, `_version` (tăng mỗi lần ghi), `_source` (dữ liệu gốc JSON).

## 3. Mapping & Data Types

**Dynamic mapping:** nếu bạn index document mà chưa khai báo mapping, Elasticsearch **tự đoán** kiểu dữ liệu. Tiện nhưng dễ sai (vd: đoán nhầm number/date, tạo cả `text` lẫn `keyword` thừa).

**Explicit mapping:** bạn tự khai báo → kiểm soát tốt, tối ưu lưu trữ & tìm kiếm. **Khuyến nghị cho production.**

### `text` vs `keyword` — điểm CỰC KỲ quan trọng
| | `text` | `keyword` |
|---|---|---|
| Có phân tích (analyzer)? | ✅ tách từ, lowercase... | ❌ lưu nguyên chuỗi |
| Dùng để | **full-text search** (match) | lọc chính xác, sort, aggregation (term) |
| Ví dụ | mô tả sản phẩm, nội dung bài viết | mã SKU, category, email, tag |

> Mẹo phổ biến: khai báo cả hai — field `text` để search, sub-field `keyword` để sort/aggregate:
> ```json
> "name": { "type": "text", "fields": { "keyword": { "type": "keyword" } } }
> ```
> Khi đó dùng `name` để full-text, `name.keyword` để sort/aggregate.

### Tổng hợp tất cả Data Types

#### String
| Type | Mô tả |
|---|---|
| `text` | Full-text search, qua analyzer (tách từ, lowercase…) |
| `keyword` | Chuỗi nguyên vẹn, dùng cho filter chính xác / sort / aggregation |

#### Numeric
| Type | Mô tả |
|---|---|
| `long` | Số nguyên 64-bit có dấu |
| `integer` | Số nguyên 32-bit có dấu |
| `short` | Số nguyên 16-bit có dấu |
| `byte` | Số nguyên 8-bit có dấu |
| `double` | Số thực 64-bit (double precision) |
| `float` | Số thực 32-bit (single precision) |
| `half_float` | Số thực 16-bit (half precision), tiết kiệm lưu trữ |
| `scaled_float` | Số thực lưu dưới dạng long × scaling factor (vd `scaling_factor: 100` cho tiền tệ) |
| `unsigned_long` | Số nguyên 64-bit không dấu |

#### Date
| Type | Mô tả |
|---|---|
| `date` | Ngày/giờ — ISO 8601, epoch ms, hoặc format tự định nghĩa |
| `date_nanos` | Ngày/giờ độ phân giải nanosecond |

#### Boolean
| Type | Mô tả |
|---|---|
| `boolean` | `true` / `false` |

#### Binary
| Type | Mô tả |
|---|---|
| `binary` | Dữ liệu nhị phân mã hoá Base64, không được index (không search được) |

#### Range
| Type | Mô tả |
|---|---|
| `integer_range` | Khoảng số nguyên |
| `long_range` | Khoảng số nguyên 64-bit |
| `float_range` | Khoảng số thực 32-bit |
| `double_range` | Khoảng số thực 64-bit |
| `date_range` | Khoảng ngày giờ |
| `ip_range` | Khoảng địa chỉ IP |

#### Object & Relational
| Type | Mô tả |
|---|---|
| `object` | JSON object lồng nhau, các field con được flatten khi index |
| `nested` | Mảng object — mỗi phần tử được index độc lập, dùng `nested query` |
| `flattened` | Toàn bộ object con lưu dưới 1 field, dùng khi cấu trúc không cố định |
| `join` | Quan hệ parent-child trong cùng 1 index |

#### Geo / Spatial
| Type | Mô tả |
|---|---|
| `geo_point` | Toạ độ lat/lon — hỗ trợ tìm theo khoảng cách, bounding box |
| `geo_shape` | Hình học phức tạp (polygon, linestring…) |
| `point` | Toạ độ Cartesian (không phải địa lý) |
| `shape` | Hình học Cartesian phức tạp |

#### Specialized
| Type | Mô tả |
|---|---|
| `ip` | Địa chỉ IPv4 / IPv6 |
| `completion` | Tối ưu cho autocomplete / suggest |
| `search_as_you_type` | Full-text search kiểu "gõ đến đâu gợi ý đến đó" |
| `token_count` | Đếm số token sau khi phân tích, lưu dưới dạng integer |
| `dense_vector` | Mảng float độ dài cố định — dùng cho vector search / kNN |
| `sparse_vector` | Vector thưa (key-value), dùng cho semantic search (ELSER) |
| `rank_feature` | Số thực dương để boost điểm relevance trong `rank_feature` query |
| `rank_features` | Nhiều `rank_feature` trong 1 field |
| `histogram` | Dữ liệu histogram pre-aggregated |
| `aggregate_metric_double` | Metric pre-aggregated (min/max/sum/value_count) |
| `percolator` | Lưu trữ query để dùng trong percolate (tìm query khớp document) |
| `alias` | Alias cho 1 field khác trong cùng index |
| `version` | Chuỗi version theo SemVer (vd `1.2.3`), so sánh đúng thứ tự |

## 4. `_bulk` API — nạp hàng loạt

Index từng document một thì chậm. `_bulk` gửi nhiều thao tác trong 1 request. Định dạng đặc biệt: **mỗi thao tác = 2 dòng** (dòng action + dòng dữ liệu), kết thúc bằng newline.

```
POST _bulk
{ "index": { "_index": "products", "_id": "1" } }
{ "name": "...", "price": 100 }
{ "index": { "_index": "products", "_id": "2" } }
{ "name": "...", "price": 200 }
```

## 5. Versioning & Optimistic Concurrency Control

Mỗi lần ghi, `_version` tăng. Để tránh 2 tiến trình ghi đè nhau, dùng `if_seq_no` + `if_primary_term` (optimistic locking): chỉ ghi nếu document chưa bị ai sửa từ lần đọc của bạn.

## 6. Bài thực hành

1. Mở [`queries.txt`](queries.txt) trong Dev Tools, chạy lần lượt từng khối.
2. Hoặc nạp dữ liệu mẫu bằng Node.js:
   ```bash
   npm run seed:products      # tạo index products + nạp 12 sản phẩm bằng _bulk
   ```
3. Xem script [`../../datasets/seed-products.js`](../../datasets/seed-products.js) để hiểu cách tạo mapping + bulk trong code.

## ✅ Checklist hoàn thành
- [ ] Tạo, đọc, cập nhật, xoá được 1 document
- [ ] Giải thích được khác biệt `text` vs `keyword`
- [ ] Tạo index với explicit mapping
- [ ] Nạp dữ liệu bằng `_bulk` (qua Dev Tools hoặc `npm run seed:products`)
- [ ] Xem được mapping tự sinh (dynamic) khác mapping tự khai báo thế nào

## 📝 Bài tập
1. Tạo index `books` với mapping: `title` (text+keyword), `author` (keyword), `year` (integer), `price` (float).
2. Thêm 3 cuốn sách bằng `_bulk`.
3. Thử `GET /books/_mapping` — so sánh với mapping bạn đã khai.
4. Index một document có field mới chưa khai báo (vd `language`) → kiểm tra dynamic mapping đã thêm field đó thế nào.
5. Partial update: tăng `price` của 1 cuốn sách mà không gửi lại toàn bộ document.

## ❓ Câu hỏi thường gặp (FAQ)

### 1. Vừa `PUT` document xong, `_search` lại không thấy?
Đây là **Near-Real-Time (NRT)** — hành vi đúng, không phải lỗi.
- Khi ghi, document vào **buffer** trước, chỉ xuất hiện trong `_search` sau lần **refresh** (mặc định **mỗi 1 giây**).
- `GET /index/_doc/<id>` (lấy theo id) thì **thấy ngay** vì đọc real-time; còn `_search` phải chờ refresh.

| Cách đọc | Thấy ngay sau khi PUT? |
|---|---|
| `GET /products/_doc/1` | ✅ Ngay lập tức |
| `GET /products/_search` | ⏳ Sau ~1s (refresh) |

Ép thấy ngay (chỉ dùng khi học/test, **tránh ở production** vì tốn tài nguyên):
```
POST /products/_refresh             # ép refresh thủ công
PUT  /products/_doc/1?refresh=true  # ghi xong refresh luôn
```

### 2. `match_all` chỉ trả về 10 record dù index có nhiều hơn?
`_search` mặc định **`size` = 10**. Đây là cơ chế phân trang, không phải mất dữ liệu.
- Tăng số lượng: thêm `"size": 20`.
- Phân trang: `from` (bỏ qua bao nhiêu) + `size` (lấy bao nhiêu).
- Tổng khớp thật sự luôn ở field **`hits.total.value`** (đúng kể cả khi `size` nhỏ); hoặc dùng `GET /products/_count`.
```json
GET /products/_search
{ "from": 0, "size": 20, "query": { "match_all": {} } }
```
> ⚠️ `from + size` chỉ hợp cho vài nghìn record đầu (ES chặn khi `> 10000`). Duyệt sâu hơn dùng `search_after` / `scroll` — học ở **Giai đoạn 4**.

### 3. Có bắt buộc chỉ định `_id` không? Không chỉ định thì sao?
**Không bắt buộc.** Nếu bỏ trống, ES **tự sinh** id ngẫu nhiên.

| | Tự chỉ định `_id` (vd id=1) | Để ES tự sinh |
|---|---|---|
| Cú pháp | `PUT /book/_doc/1` | `POST /book/_doc` hoặc `_bulk` bỏ `_id` |
| Chạy lại cùng lệnh | **Ghi đè**, không trùng | Tạo **document mới** → **bị trùng lặp** |
| Update/Delete theo id | Dễ (biết id) | Khó (phải search ra id) |
| Tốc độ ghi | Hơi chậm (kiểm tra id tồn tại) | Nhanh hơn |
| Hợp với | Thực thể có khoá tự nhiên: sản phẩm, user, **sách (ISBN)** | Dữ liệu append-only: **log, event** |

> Cái bẫy: `POST /book/_doc` chạy 2 lần → 2 document trùng nội dung (khác id). Còn `PUT /book/_doc/2` chạy 2 lần → vẫn 1 document (ghi đè).

➡️ Tiếp theo: [Giai đoạn 2 — Text Analysis](../02-text-analysis/README.md)
