import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Cloudflare R2 Client Configuration
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

const bucketName = process.env.R2_BUCKET_NAME!
const publicUrl = process.env.R2_PUBLIC_URL!

/**
 * อัปโหลดไฟล์ไปยัง R2
 */
export async function uploadToR2(
  key: string,
  file: Buffer | Uint8Array | Blob,
  contentType?: string
) {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: file,
    ContentType: contentType,
  })

  await r2Client.send(command)

  // Return public URL
  return `${publicUrl}/${key}`
}

/**
 * ดึงไฟล์จาก R2
 */
export async function getFromR2(key: string) {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  })

  const response = await r2Client.send(command)
  return response.Body
}

/**
 * ลบไฟล์จาก R2
 */
export async function deleteFromR2(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  })

  await r2Client.send(command)
}

/**
 * สร้าง Presigned URL สำหรับอัปโหลดโดยตรง (จาก client-side)
 */
export async function getPresignedUploadUrl(key: string, expiresIn: number = 3600) {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
  })

  return await getSignedUrl(r2Client, command, { expiresIn })
}

/**
 * สร้าง Presigned URL สำหรับดาวน์โหลด
 */
export async function getPresignedDownloadUrl(key: string, expiresIn: number = 3600) {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  })

  return await getSignedUrl(r2Client, command, { expiresIn })
}

export { r2Client, bucketName, publicUrl }
