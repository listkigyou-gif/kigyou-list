const path = require("path");
const fs = require("fs");
const { S3Client, PutObjectCommand } = require(path.join(__dirname, "../frontend/node_modules/@aws-sdk/client-s3"));
const dotenv = require(path.join(__dirname, "../frontend/node_modules/dotenv"));

dotenv.config({ path: path.join(__dirname, "../frontend/.env.local") });

const r2Endpoint = process.env.R2_ENDPOINT;
const r2AccessKeyId = process.env.R2_ACCESS_KEY_ID;
const r2SecretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const r2BucketName = process.env.R2_BUCKET_NAME;

if (!r2Endpoint || !r2AccessKeyId || !r2SecretAccessKey || !r2BucketName) {
  console.error("Missing R2 credentials");
  process.exit(1);
}

const s3Client = new S3Client({
  region: "auto",
  endpoint: r2Endpoint,
  credentials: {
    accessKeyId: r2AccessKeyId,
    secretAccessKey: r2SecretAccessKey,
  },
});

async function upload() {
  const filePath = path.join(__dirname, "articles/qiita_ai_tagging_arch.jpg");
  const fileBuffer = fs.readFileSync(filePath);
  const key = "uploads/logos/qiita_ai_tagging_arch.jpg";

  const command = new PutObjectCommand({
    Bucket: r2BucketName,
    Key: key,
    Body: fileBuffer,
    ContentType: "image/jpeg",
  });

  await s3Client.send(command);
  console.log(`Successfully uploaded to R2: ${key}`);
  console.log(`Public URL: https://kigyoulist.com/api/uploads/logos/qiita_ai_tagging_arch.jpg`);
}

upload().catch((err) => {
  console.error("Upload error:", err);
  process.exit(1);
});
