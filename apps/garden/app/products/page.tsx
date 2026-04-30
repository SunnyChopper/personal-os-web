import Link from 'next/link';

/**
 * Framer Motion can SSR with `opacity: 0` on this route; if client JS is slow or fails, the page
 * looks blank. This page is static so the first paint is always correct (no hidden SSR shell).
 */
export default function ProductsPage() {
  return (
    <>
      <section
        className="relative flex h-[40vh] items-center justify-center bg-cover bg-center"
        style={{ backgroundImage: 'url(/images/cover.jpg)' }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-white md:text-5xl">Published Products</h1>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <Link
                href="/products/canvascraft"
                className="block overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-md transition-shadow duration-300 hover:shadow-xl"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/canvas-craft-square-logo-transparent.png"
                  alt="CanvasCraft"
                  className="mb-6 w-full"
                />
                <h2 className="mb-2 text-2xl font-bold text-gray-900">CanvasCraft</h2>
                <h5 className="mb-4 text-gray-500">Published April 2024</h5>
                <p className="mb-4 text-gray-700">
                  CanvasCraft is a tool for entrepreneurs to swiftly turn ideas into strategic
                  plans. Its intuitive interface and GPT API integration streamline the Lean Canvas
                  process and generate business plans efficiently.
                </p>
                <p className="text-gray-700">
                  The backend API runs on AWS (API Gateway, Lambda, and DynamoDB), and the frontend
                  uses React Native and Expo.
                </p>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
