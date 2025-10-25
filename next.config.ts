import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['@google/generative-ai', 'groq-sdk'],
  env: {
    GOOGLE_AI_STUDIO_API_KEY: process.env.GOOGLE_AI_STUDIO_API_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
  }
};

export default nextConfig;
