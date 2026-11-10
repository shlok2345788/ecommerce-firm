# ecommerce-firm

Product image uploads use Backblaze B2 when the `B2_*` variables are configured,
Vercel Blob when `BLOB_READ_WRITE_TOKEN` is configured, and local
`public/uploads` storage during local development. Configure one of the
persistent storage providers before deploying to Vercel.

The deployed app uses its built-in API routes by default. Set
`USE_EXTERNAL_API=true` only when intentionally routing API requests to
`BACKEND_URL`.
