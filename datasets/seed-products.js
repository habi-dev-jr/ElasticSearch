// Nạp dữ liệu sản phẩm mẫu vào index "products" bằng _bulk API.
// Chạy: npm run seed:products
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { client } from "../client/connect.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const INDEX = "products";

// 1) Đọc dữ liệu từ file JSON
const raw = await readFile(join(__dirname, "products.json"), "utf-8");
const products = JSON.parse(raw);

// 2) Tạo lại index với mapping rõ ràng (xoá nếu đã tồn tại)
if ((await client.indices.exists({ index: INDEX })).body) {
  await client.indices.delete({ index: INDEX });
}
await client.indices.create({
  index: INDEX,
  body: {
    mappings: {
      properties: {
        name: { type: "text", fields: { keyword: { type: "keyword" } } },
        category: { type: "keyword" },
        brand: { type: "keyword" },
        price: { type: "long" },
        stock: { type: "integer" },
        rating: { type: "float" },
        tags: { type: "keyword" },
        created_at: { type: "date" },
      },
    },
  },
});

// 3) Tạo body cho _bulk: mỗi document gồm 2 dòng (action + source)
const body = products.flatMap((doc) => [
  { index: { _index: INDEX, _id: String(doc.id) } },
  doc,
]);

const { body: bulkResponse } = await client.bulk({ refresh: true, body });

// 4) Kiểm tra lỗi
if (bulkResponse.errors) {
  const erroredItems = bulkResponse.items.filter((i) => i.index?.error);
  console.error("❌ Có lỗi khi nạp:", erroredItems.length, "document");
  console.error(JSON.stringify(erroredItems[0], null, 2));
  process.exit(1);
}

const count = await client.count({ index: INDEX });
console.log(`✅ Đã nạp ${products.length} sản phẩm vào index "${INDEX}".`);
console.log(`   Tổng document trong index: ${count.body.count}`);
