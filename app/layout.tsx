import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = { title: "HR SaaS Effort Planner", description: "HR SaaS導入による業務工数削減の概算と相談申込" };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="ja"><body>{children}</body></html>; }
