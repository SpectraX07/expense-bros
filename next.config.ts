import type { NextConfig } from "next";

const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (process.env.VERCEL && (!process.env.NEXT_PUBLIC_SUPABASE_URL || !publishableKey)) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Set them in Vercel → Project Settings → Environment Variables for Production, Preview, and Development.",
  );
}

const nextConfig: NextConfig = {};

export default nextConfig;
