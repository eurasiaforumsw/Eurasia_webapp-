# Library Configuration Files

## Supabase (`supabase.ts`)

### Client-side Usage
```typescript
import { supabase } from '@/lib/supabase'

// Query data
const { data, error } = await supabase
  .from('your_table')
  .select('*')

// Insert data
const { data, error } = await supabase
  .from('your_table')
  .insert({ column: 'value' })
```

### Server-side Usage (API Routes)
```typescript
import { supabaseAdmin } from '@/lib/supabase'

// Use service role for admin operations
const { data, error } = await supabaseAdmin
  .from('your_table')
  .select('*')
```

## Cloudflare R2 (`r2.ts`)

### Upload File
```typescript
import { uploadToR2 } from '@/lib/r2'

const file = await fetch('image.jpg').then(r => r.arrayBuffer())
const url = await uploadToR2('path/to/image.jpg', Buffer.from(file), 'image/jpeg')
console.log('File URL:', url)
```

### Download File
```typescript
import { getFromR2 } from '@/lib/r2'

const stream = await getFromR2('path/to/file.jpg')
```

### Delete File
```typescript
import { deleteFromR2 } from '@/lib/r2'

await deleteFromR2('path/to/file.jpg')
```

### Presigned URLs (สำหรับให้ client อัปโหลดโดยตรง)
```typescript
import { getPresignedUploadUrl } from '@/lib/r2'

const uploadUrl = await getPresignedUploadUrl('path/to/file.jpg', 3600) // expires in 1 hour
// ส่ง uploadUrl ไปให้ client ใช้ PUT request อัปโหลดไฟล์โดยตรง
```

## Required Dependencies

Install these packages:

```bash
npm install @supabase/supabase-js @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

or

```bash
pnpm add @supabase/supabase-js @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```
