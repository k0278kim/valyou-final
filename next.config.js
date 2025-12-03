/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
    images: {
        remotePatterns: [
            {
        protocol: "https",
                hostname: "**", // 모든 https 도메인 허용
            },
            {
                protocol: "http",
                hostname: "**", // 모든 http 도메인 허용
            },
        ]
    }
};

export default config;
