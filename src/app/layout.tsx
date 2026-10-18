import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OmniStore | Multi-Tenant Relational E-Commerce Platform',
  description: 'High-performance PostgreSQL multi-tenant e-commerce platform with zero payment gateway friction, guest checkout, and direct merchant fulfillment.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
