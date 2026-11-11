# ecommerce-firm

Product image uploads use Backblaze B2 when the `B2_*` variables are configured,
Vercel Blob when `BLOB_READ_WRITE_TOKEN` is configured, and local
`public/uploads` storage during local development. Configure one of the
persistent storage providers before deploying to Vercel.

For Backblaze B2, configure `B2_APPLICATION_KEY_ID`, `B2_APPLICATION_KEY`,
`B2_BUCKET_NAME`, and optionally `B2_REGION`, `B2_ENDPOINT`, and `B2_PUBLIC_URL`.
The bucket must allow public reads when its returned image URLs are displayed
directly by the storefront. If `USE_EXTERNAL_API=true` is set, the backend
must also expose `POST /api/admin/upload`; otherwise leave it unset so the
built-in Next.js route handles uploads.

Uploads are limited to 4 MB per image. Bulk imports upload images in automatic
sub-3.5 MB batches, then send the spreadsheet rows and image URLs separately,
so an import of up to 1,000 products does not put all image bytes in one Vercel
request. Very large spreadsheets should still be split into smaller imports.

The deployed app uses its built-in API routes by default. Set
`USE_EXTERNAL_API=true` only when intentionally routing API requests to
`BACKEND_URL`.

Database connections use `DATABASE_URL`, with `POSTGRES_PRISMA_URL` and
`POSTGRES_URL` as runtime fallbacks for Vercel Postgres integrations.

Before the first production login, initialize the configured production
database from the repository root with `npm run db:deploy`, then run
`npm run db:seed` once to create the initial Superadmin account. The seed
script also removes its listed legacy demo records, so do not run it again
against a database containing data you need to preserve.
