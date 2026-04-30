import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Products | Sunny Singh',
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
