import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // NOTE: SVGR works via Webpack. If you’re using Turbopack, switch to Webpack for now.
  webpack: (config) => {
    // Find the rule that handles images and exclude .svg from it
    const assetRule = config.module.rules.find(
      // @ts-expect-error - test is a regex
      (rule) => rule && typeof rule === "object" && rule.test?.test?.(".svg")
    );
    if (assetRule && typeof assetRule === "object") {

      assetRule.exclude = /\.svg$/i;
    }

    // Add our custom SVG handling
    config.module.rules.push({
      test: /\.svg$/i,
      oneOf: [
        // Keep the ability to import a raw URL: import logoUrl from './logo.svg?url'
        {
          resourceQuery: /url/,
          type: "asset/resource",
        },
        // Default: import as React component: import Logo from './logo.svg'
        {
          use: [
            {
              loader: "@svgr/webpack",
              options: {
                svgo: true,
                // Helpful flags
                titleProp: true,
                ref: true,
              },
            },
          ],
        },
      ],
    });

    return config;
  },
};

export default nextConfig;
