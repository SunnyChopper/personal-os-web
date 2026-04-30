import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'CanvasCraft | Sunny Singh',
};

export default function CanvasCraftProductPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <Link href="/products" className="text-sm text-primary hover:underline">
        ← Products
      </Link>
      <div className="mt-6 flex flex-col gap-6">
        <Image
          src="/images/canvas-craft-square-logo-transparent.png"
          alt="CanvasCraft"
          width={400}
          height={200}
          className="w-full max-w-md"
          priority
        />
        <h1 className="font-serif text-4xl font-bold text-gray-900">CanvasCraft</h1>
        <p className="text-gray-600">Published April 2024</p>
        <p className="text-gray-700">
          CanvasCraft is a tool for entrepreneurs to swiftly turn ideas into strategic plans. Its
          intuitive interface and GPT API integration streamline the Lean Canvas process and
          generate business plans efficiently.
        </p>
        <p className="text-gray-700">
          The backend API runs on AWS (API Gateway, Lambda, and DynamoDB), and the frontend uses
          React Native and Expo.
        </p>
      </div>
    </div>
  );
}
