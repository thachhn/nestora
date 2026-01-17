import { resolve } from "path";
import { execSync } from "child_process";
import fs from "fs";
import { dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));

const allProducts = fs.readdirSync(resolve(__dirname, "./products"));


/**
 * Upload to Google Cloud Storage
 * Upload build.html files to GCS bucket nestora-internal-f
 */
async function uploadToGCS(id: string): Promise<boolean> {
  console.log(`\n🔄 Syncing ${id} folder...`);
  const productsScriptDir = resolve(__dirname, "./products", id);
  const gcsSyncScript = resolve(__dirname, "./gcs-sync.ts");


  try {

    // Chạy gcs-sync script
    // console.log("   Đang chạy ", `ts-node ${gcsSyncScript} ${productsScriptDir}`);
    execSync(`ts-node ${gcsSyncScript} ${productsScriptDir}`, {
      stdio: "inherit",
    });
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("\n❌ Lỗi khi upload:", errorMessage);
    return false;
  }
}

async function main() {
  await uploadToGCS('common');
  for (const product of allProducts) {
    await uploadToGCS(product);
  }
}

main();
