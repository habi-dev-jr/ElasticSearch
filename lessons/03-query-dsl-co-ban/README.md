# Giai đoạn 3 — Query DSL cơ bản

> Mục tiêu: viết được query tìm kiếm, lọc, kết hợp điều kiện, sắp xếp và phân trang dữ liệu trong Elasticsearch.
> Cần dữ liệu mẫu: chạy `npm run seed:products` trước.

---

## 1. Query context vs Filter context

Đây là khái niệm **quan trọng nhất** trong Query DSL. Mỗi query bạn viết chạy ở 1 trong 2 ngữ cảnh này.

### Query context — tính điểm relevance

- ES thực thi query và tính **`_score`** (điểm liên quan) cho mỗi document khớp.
- Điểm cao hơn → document xuất hiện đầu kết quả.
- Dùng khi cần **full-text search** — người dùng muốn kết quả liên quan nhất lên trên.
- Tốn CPU hơn vì phải tính điểm.

### Filter context — lọc đúng/sai

- ES chỉ hỏi: document này có khớp điều kiện không? **Yes/No** — không tính điểm.
- Kết quả được **cache** tự động → lần sau truy vấn cùng filter thì nhanh hơn nhiều.
- Dùng khi cần **lọc dữ liệu**: price < 10 triệu, category = "laptop", in_stock = true.
- Nhanh hơn và tiết kiệm tài nguyên hơn query context.

### So sánh

| | Query context | Filter context |
|---|---|---|
| Tính `_score`? | ✅ Có | ❌ Không |
| Cache? | ❌ Không | ✅ Có |
| Dùng cho | Full-text search | Lọc chính xác (số, ngày, keyword) |
| Tốc độ | Chậm hơn | Nhanh hơn |
| Ví dụ | `match`, `match_phrase` | `term`, `range`, `exists` |

### Ví dụ thực tế

```json
GET /products/_search
{
  "query": {
    "bool": {
      "must":   [ { "match": { "name": "laptop" } } ],   // query context → tính điểm
      "filter": [ { "range": { "price": { "lte": 35000000 } } } ]  // filter context → không tính điểm, có cache
    }
  }
}
```

> **Quy tắc thực tế:** full-text search của người dùng → `must` (query context). Lọc theo giá, danh mục, trạng thái → `filter` (filter context). Không bao giờ bỏ điều kiện lọc vào `must` nếu không cần tính điểm — lãng phí tài nguyên.

### Tại sao phải dùng `bool` ở đây?

`must` và `filter` **không phải query độc lập** — chúng là mệnh đề bên trong `bool`. Không có `bool` thì không thể viết chúng:

```json
// ❌ Sai — must không phải query type
{ "query": { "must": [ { "match": { "name": "laptop" } } ] } }

// ❌ Sai — filter không phải query type
{ "query": { "filter": [ { "range": { "price": { "lte": 35000000 } } } ] } }

// ✅ Đúng — bool là cái hộp chứa, must/filter/should/must_not nằm bên trong
{ "query": { "bool": { "must": [...], "filter": [...] } } }
```

Ngay cả khi chỉ có **1 điều kiện duy nhất** nhưng muốn nó chạy ở filter context (không tính điểm, có cache), vẫn phải bọc trong `bool`:

```json
// Chỉ lọc giá, không cần tính điểm → bọc trong bool.filter
GET /products/_search
{
  "query": {
    "bool": {
      "filter": [
        { "range": { "price": { "lte": 35000000 } } }
      ]
    }
  }
}
```

Nếu không cần kết hợp và không cần kiểm soát context, có thể viết query trực tiếp không qua `bool`:

```json
// Chỉ match đơn thuần — không cần bool
GET /products/_search
{
  "query": {
    "match": { "name": "laptop" }
  }
}
```

Nhưng ngay khi cần **thêm 1 điều kiện bất kỳ** (dù chỉ là lọc giá) → phải dùng `bool`.

---

## 2. Full-text queries

Dùng cho field kiểu `text` — query đi qua analyzer trước khi tìm kiếm.

### `match` — tìm kiếm từng từ (OR mặc định)

Query cơ bản nhất cho full-text search. ES tách query thành token rồi tìm document chứa ít nhất 1 token.

```json
GET /products/_search
{
  "query": {
    "match": {
      "name": "laptop dell"
    }
  }
}
```

Mặc định là **OR**: tìm document có "laptop" **hoặc** "dell". Đổi thành AND:

```json
GET /products/_search
{
  "query": {
    "match": {
      "name": {
        "query": "laptop dell",
        "operator": "and"
      }
    }
  }
}
```

Cho phép sai tối đa 1 ký tự (fuzzy):

```json
GET /products/_search
{
  "query": {
    "match": {
      "name": {
        "query": "labtop",
        "fuzziness": "AUTO"
      }
    }
  }
}
```

---

### `match_phrase` — khớp cụm từ đúng thứ tự

Các từ phải xuất hiện **liền nhau đúng thứ tự** trong document.

```json
GET /products/_search
{
  "query": {
    "match_phrase": {
      "name": "dell xps"
    }
  }
}
```

- `"dell xps"` → khớp với "Dell XPS 13", "Dell XPS 15" ✅
- `"dell xps"` → **không** khớp với "XPS Dell" hay "Dell ... XPS" ❌

Cho phép khoảng cách tối đa giữa các từ (`slop`):

```json
GET /products/_search
{
  "query": {
    "match_phrase": {
      "description": {
        "query": "màn hình sắc nét",
        "slop": 2
      }
    }
  }
}
```

`slop: 2` → cho phép tối đa 2 từ chen giữa → khớp "màn hình **rất** sắc nét" ✅

---

### So sánh `match` vs `match_phrase`

```
Document: "Laptop Dell XPS 13 màn hình sắc nét"

match "dell xps"         → ✅ (có "dell" hoặc "xps")
match_phrase "dell xps"  → ✅ (dell và xps liền nhau đúng thứ tự)
match_phrase "xps dell"  → ❌ (sai thứ tự)
match_phrase "dell 13"   → ❌ (không liền nhau)
match_phrase "dell 13" slop:1 → ✅ (cách nhau 1 từ "xps")
```

---

## 3. Term-level queries

Dùng để lọc chính xác — **không qua analyzer**, so sánh giá trị nguyên vẹn. Thường dùng với field kiểu `keyword`, `number`, `date`, `boolean`.

### `term` — khớp chính xác 1 giá trị

```json
GET /products/_search
{
  "query": {
    "term": {
      "category.keyword": "Laptop"
    }
  }
}
```

> **Bẫy thường gặp:** dùng `term` trên field `text` sẽ không ra kết quả vì field `text` đã bị lowercase lúc index (token là `"laptop"`) nhưng `term` tìm giá trị gốc `"Laptop"` → không khớp. Luôn dùng `term` với `.keyword`.

---

### `terms` — khớp nhiều giá trị (tương đương IN)

```json
GET /products/_search
{
  "query": {
    "terms": {
      "category.keyword": ["Laptop", "Điện thoại", "Máy tính bảng"]
    }
  }
}
```

---

### `range` — lọc theo khoảng

```json
GET /products/_search
{
  "query": {
    "range": {
      "price": {
        "gte": 10000000,
        "lte": 30000000
      }
    }
  }
}
```

| Toán tử | Ý nghĩa |
|---|---|
| `gte` | >= (greater than or equal) |
| `gt` | > (greater than) |
| `lte` | <= (less than or equal) |
| `lt` | < (less than) |

Dùng với `date`:

```json
GET /products/_search
{
  "query": {
    "range": {
      "created_at": {
        "gte": "2024-01-01",
        "lte": "2024-12-31",
        "format": "yyyy-MM-dd"
      }
    }
  }
}
```

---

### `exists` — kiểm tra field có tồn tại không

```json
// Tìm document CÓ field "discount"
GET /products/_search
{
  "query": {
    "exists": { "field": "discount" }
  }
}

// Tìm document KHÔNG CÓ field "discount" (kết hợp must_not)
GET /products/_search
{
  "query": {
    "bool": {
      "must_not": [
        { "exists": { "field": "discount" } }
      ]
    }
  }
}
```

---

### `prefix` — tìm theo tiền tố

```json
GET /products/_search
{
  "query": {
    "prefix": {
      "sku.keyword": "DELL-"
    }
  }
}
```

Khớp: `"DELL-XPS-001"`, `"DELL-INS-002"` ✅

---

### `wildcard` — tìm theo pattern

```json
GET /products/_search
{
  "query": {
    "wildcard": {
      "sku.keyword": "DELL-*-2024"
    }
  }
}
```

| Ký tự | Ý nghĩa |
|---|---|
| `*` | Khớp 0 hoặc nhiều ký tự bất kỳ |
| `?` | Khớp đúng 1 ký tự bất kỳ |

> **Lưu ý hiệu suất:** `wildcard` và `prefix` với `*` ở đầu (vd `"*dell"`) rất chậm vì phải quét toàn bộ inverted index. Tránh dùng ở production cho dataset lớn.

---

### Tổng hợp term-level queries

| Query | Dùng cho | Ví dụ |
|---|---|---|
| `term` | Khớp chính xác 1 giá trị | `category = "Laptop"` |
| `terms` | Khớp 1 trong nhiều giá trị | `category IN ["Laptop", "Phone"]` |
| `range` | Khoảng số / ngày | `price BETWEEN 10tr AND 30tr` |
| `exists` | Field có tồn tại không | `discount IS NOT NULL` |
| `prefix` | Bắt đầu bằng | `sku LIKE "DELL-%"` |
| `wildcard` | Pattern với `*` và `?` | `sku LIKE "DELL-%-2024"` |

---

## 4. `bool` query — kết hợp nhiều điều kiện

`bool` là cách duy nhất để kết hợp nhiều query lại. Gồm 4 mệnh đề:

| Mệnh đề | Logic | Tính điểm? | Ý nghĩa |
|---|---|---|---|
| `must` | AND | ✅ Có | Phải khớp, đóng góp vào `_score` |
| `should` | OR | ✅ Có | Khuyến khích khớp, tăng điểm nếu có |
| `must_not` | NOT | ❌ Không | Phải không khớp, chạy ở filter context |
| `filter` | AND | ❌ Không | Phải khớp, không tính điểm, có cache |

### Ví dụ đầy đủ

```json
GET /products/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "name": "laptop" } }
      ],
      "should": [
        { "match": { "name": "dell" } },
        { "match": { "name": "apple" } }
      ],
      "must_not": [
        { "term": { "in_stock": false } }
      ],
      "filter": [
        { "range": { "price": { "lte": 35000000 } } },
        { "term": { "category.keyword": "Laptop" } }
      ]
    }
  }
}
```

Đọc query trên như sau: tìm sản phẩm **có tên chứa "laptop"** (`must`) **và** giá ≤ 35 triệu, category là Laptop (`filter`) **và không** hết hàng (`must_not`). Nếu tên có thêm "dell" hoặc "apple" thì điểm cao hơn (`should`).

---

### `should` và `minimum_should_match`

Mặc định: nếu có `must` hoặc `filter` thì `should` chỉ tăng điểm, không bắt buộc khớp. Nếu **chỉ có `should`** thì mặc định phải khớp ít nhất 1.

Ép số lượng `should` tối thiểu phải khớp:

```json
GET /products/_search
{
  "query": {
    "bool": {
      "should": [
        { "term": { "brand.keyword": "Dell" } },
        { "term": { "brand.keyword": "Apple" } },
        { "term": { "brand.keyword": "Asus" } }
      ],
      "minimum_should_match": 1
    }
  }
}
```

---

### `bool` lồng nhau

`bool` có thể lồng vào bên trong `bool` khác để tạo điều kiện phức tạp:

```json
GET /products/_search
{
  "query": {
    "bool": {
      "must": [
        { "match": { "name": "laptop" } }
      ],
      "filter": [
        {
          "bool": {
            "should": [
              { "range": { "price": { "lte": 10000000 } } },
              { "term":  { "is_sale": true } }
            ]
          }
        }
      ]
    }
  }
}
```

Ý nghĩa: tìm laptop **và** (giá ≤ 10 triệu **hoặc** đang giảm giá).

---

## 5. Sort, Pagination, và `_source`

### Sort — sắp xếp kết quả

Mặc định ES sắp xếp theo `_score` giảm dần. Tuỳ chỉnh:

```json
GET /products/_search
{
  "query": { "match_all": {} },
  "sort": [
    { "price": { "order": "asc" } },
    { "name.keyword": { "order": "asc" } }
  ]
}
```

Sort nhiều field: sort theo `price` tăng dần trước, cùng giá thì sort theo `name` tăng dần.

> **Lưu ý:** sort phải dùng field `keyword` (không dùng `text`) hoặc field số/ngày. Sort trên `text` sẽ báo lỗi.

Sort kết hợp với query:

```json
GET /products/_search
{
  "query": {
    "match": { "name": "laptop" }
  },
  "sort": [
    "_score",
    { "price": { "order": "asc" } }
  ]
}
```

Sort theo `_score` trước (liên quan nhất lên đầu), cùng điểm thì sort theo giá.

---

### Pagination — phân trang với `from` / `size`

```json
GET /products/_search
{
  "query": { "match_all": {} },
  "from": 0,
  "size": 10
}
```

| Tham số | Ý nghĩa | Mặc định |
|---|---|---|
| `size` | Số document trả về | 10 |
| `from` | Bỏ qua bao nhiêu document đầu | 0 |

Công thức tính trang:
```
from = (page - 1) × size

Trang 1: from=0,  size=10
Trang 2: from=10, size=10
Trang 3: from=20, size=10
```

Xem tổng số kết quả tại `hits.total.value` trong response.

> **Giới hạn:** ES chặn `from + size > 10000` (mặc định). Phân trang sâu hơn dùng `search_after` — học ở Giai đoạn 4.

---

### `_source` — chọn field trả về

Mặc định ES trả về toàn bộ `_source`. Lọc chỉ lấy field cần thiết để giảm băng thông:

```json
// Chỉ lấy name và price
GET /products/_search
{
  "query": { "match_all": {} },
  "_source": ["name", "price", "category"]
}

// Bỏ field cụ thể, lấy hết còn lại
GET /products/_search
{
  "query": { "match_all": {} },
  "_source": {
    "excludes": ["description", "raw_data"]
  }
}

// Tắt hoàn toàn _source (chỉ lấy metadata _id, _score)
GET /products/_search
{
  "query": { "match_all": {} },
  "_source": false
}
```

---

### Kết hợp tất cả — query thực tế

```json
GET /products/_search
{
  "_source": ["name", "price", "category", "brand"],
  "query": {
    "bool": {
      "must": [
        { "match": { "name": "laptop" } }
      ],
      "filter": [
        { "term":  { "category.keyword": "Laptop" } },
        { "range": { "price": { "gte": 10000000, "lte": 50000000 } } },
        { "term":  { "in_stock": true } }
      ],
      "should": [
        { "term": { "brand.keyword": "Dell" } },
        { "term": { "brand.keyword": "Apple" } }
      ]
    }
  },
  "sort": [
    "_score",
    { "price": { "order": "asc" } }
  ],
  "from": 0,
  "size": 10
}
```

---

## ✅ Checklist hoàn thành

- [ ] Giải thích được sự khác biệt query context vs filter context
- [ ] Dùng `match` và `match_phrase` tìm kiếm full-text
- [ ] Dùng `term`, `terms`, `range`, `exists`, `prefix`, `wildcard` để lọc
- [ ] Kết hợp `bool` với `must`, `should`, `must_not`, `filter`
- [ ] Phân trang bằng `from` / `size`, hiểu giới hạn 10000
- [ ] Lọc field trả về bằng `_source`
- [ ] Viết được 1 query hoàn chỉnh: tìm kiếm + lọc + sắp xếp + phân trang

## 📝 Bài tập

1. Tìm tất cả sản phẩm có tên chứa "dell" hoặc "apple" (dùng `match` với `operator: or`).
2. Tìm sản phẩm có giá từ 5 triệu đến 20 triệu, còn hàng (`in_stock: true`), sắp xếp giá tăng dần.
3. Tìm sản phẩm **không có** field `discount` (dùng `must_not` + `exists`).
4. Dùng `match_phrase` tìm sản phẩm có mô tả chứa cụm từ "pin trâu" — so sánh kết quả với `match`.
5. Viết query lấy trang 2 (10 items/trang) của sản phẩm category "Laptop", sort theo `price` giảm dần, chỉ trả về field `name`, `price`, `brand`.
6. Viết `bool` query lồng nhau: tìm laptop (must) **và** (giá < 15 triệu **hoặc** brand là "Asus").

## ❓ FAQ

### Tại sao dùng `filter` thay vì `must` cho điều kiện lọc?
`filter` không tính `_score` và được cache — nhanh hơn đáng kể. Dùng `must` khi bạn muốn điều kiện đó **ảnh hưởng đến thứ tự kết quả** (tính relevance). Lọc giá, category, trạng thái không cần tính điểm → luôn dùng `filter`.

### `term` vs `match` — khi nào dùng cái nào?
- `term` → field `keyword`, số, ngày — so sánh chính xác, không qua analyzer.
- `match` → field `text` — qua analyzer, dùng cho full-text search.
- Dùng `term` trên field `text` thường không ra kết quả do không khớp token.

### `should` có bắt buộc phải khớp không?
Phụ thuộc vào context: nếu trong `bool` **chỉ có `should`** → mặc định phải khớp ít nhất 1. Nếu `bool` đã có `must` hoặc `filter` → `should` chỉ tăng điểm, không bắt buộc. Dùng `minimum_should_match` để kiểm soát.

---

➡️ Tiếp theo: [Giai đoạn 4 — Search nâng cao](../04-search-nang-cao/README.md)
