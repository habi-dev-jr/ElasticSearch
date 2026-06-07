// Kiểm tra kết nối tới cluster. Chạy: npm run ping
import { client } from "./connect.js";

try {
  const health = await client.cluster.health();
  const info = await client.info();
  console.log("✅ Kết nối thành công!");
  console.log("   Cluster :", info.body.cluster_name);
  console.log("   Phiên bản:", info.body.version.number, `(distribution: ${info.body.version.distribution || "elasticsearch"})`);
  console.log("   Trạng thái:", health.body.status, "| số node:", health.body.number_of_nodes);
} catch (err) {
  console.error("❌ Không kết nối được:", err.message);
  console.error("   -> Kiểm tra container đã chạy chưa: docker compose ps");
  process.exit(1);
}
