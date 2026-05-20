import type { NextConfig } from "next";

const isExport = process.env.NEXT_OUTPUT === "export";

const nextConfig: NextConfig = isExport ? {output: "export"} : {};

export default nextConfig;
