import Calculator from "../Calculator";
import Link from "next/link";

export default function CalculatorPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <nav className="border-b border-white bg-white px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-indigo-600 rounded-md"></div>
          <span className="font-semibold text-gray-900 text-lg">Takehome</span>
        </Link>
      </nav>
      <div className="max-w-2xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Your take-home calculator</h1>
        <p className="text-gray-500 mb-8 text-sm">Based on 2024/25 UK tax rates</p>
        <Calculator />
      </div>
    </main>
  );
}