import { IS_PROD, ONLINE_DOMAINS } from "./dev/env";
export const baseDNSPrefetchHost = [
  ...ONLINE_DOMAINS,
  "//p3-gameunion-sign.dailygn.com/",
  "//p6-gameunion-sign.dailygn.com/",
  "//p9-gameunion-sign.dailygn.com/",
  "//sf16-short-va.bytedapm.com/",
  "//mcs.zijieapi.com/",
  "//mon.zijieapi.com/",
  "//api.feelgood.cn/",
];

/**
 *
 * @param {*} hosts 添加 dns-prefetch host
 * @param {*} cover 是否覆盖 baseDNSPrefetchHost
 * @returns
 */
export function genDNSPrefetch() {
  return baseDNSPrefetchHost.map((href) => ({
    href,
  }));
}

const minSize = 100 * 1024;
const nodeModules = (pkgName: string) => `[\\/]node_modules[\\/]${pkgName}`;
const genChunkSplit = (pureChunkConfig: Record<string, string[]>) => {
  const toPkgNames = (chunk: string) =>
    pureChunkConfig[chunk].map((pkgName) => nodeModules(pkgName)).join("|");
  const pureChunkNames = Object.keys(pureChunkConfig);

  const MinPriority = 100;
  const MaxPriority = 1000;
  const cacheGroups = {
    ...pureChunkNames.reduce((groups, chunkName, idx) => {
      const test = new RegExp(toPkgNames(chunkName));
      return {
        ...groups,
        [`async-${chunkName}`]: {
          chunks: "async",
          test,
          priority: MaxPriority + idx,
          reuseExistingChunk: true,
          name: `async/${chunkName}`,
          minChunks: 1,
          minSize,
          filename: "[name].[contenthash:8].js",
        },
        // split chunk，defer 加载
        [`${chunkName}`]: {
          test,
          priority: MinPriority + idx,
          reuseExistingChunk: true,
          minSize,
          minChunks: 1,
          name: `chunk/${chunkName}`,
          filename: "[name].[contenthash:8].js",
        },
      };
    }, {}),
  };

  return cacheGroups;
};

export const performance = {
  buildCache: !IS_PROD,
  dnsPrefetch: IS_PROD ? genDNSPrefetch().map((item) => item.href) : [],
  chunkSplit: {
    strategy: "custom" as const,
    splitChunks: {
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
          name: "vendor",
          filename: "[name].[contenthash:8].js",
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
          filename: "[name].[contenthash:8].js",
        },
        webcast_game_open_components: {
          test: /\/packages\/libs\/components\/.*/,
          // 加载优先级要比semi低 这样可以覆盖semi样式
          priority: 99,
          reuseExistingChunk: true,
          name: "webcast_game_open_components",
          minSize: 1,
          minChunks: 1,
        },
        ...genChunkSplit({
          "@webcast/tinker-ui": ["@webcast/tinker-ui"],
          "@douyinfe/semi-ui": [
            "@douyinfe/semi-ui",
            "@douyinfe/semi-foundation",
          ],
          "semi-assets": [
            "@ies/semi-icons",
            "@douyinfe/semi-icons",
            "@ies/semi-illustrations",
            "@douyinfe/semi-illustrations",
          ],
          "@webcast/platform-component": ["@webcast/platform-component"],
          "@ies/webcast_ark_open_union_center": [
            "@ies/webcast_ark_open_union_center",
          ],
          "@webcast/vista-request": ["@webcast/vista-request"],
          "@syllepsis": ["@syllepsis"],
          "@byted/xgplayer": ["@byted/xgplayer"],
          xgplayer: ["xgplayer"],
          echarts: ["echarts"],
          xlsx: ["xlsx"],
          pdfjs: ["pdfjs"],
          "@byted/h265-player": ["@byted/h265-player"],
          "core-js": ["core-js"],
          "crypto-js": ["crypto-js"],
          "tea-sdk": ["tea-sdk"],
          lodash: ["lodash-es", "lodash"],
          slardar: ["slardar"],
          jsencrypt: ["jsencrypt"],
          "date-fns": ["date-fns"],
          "@byted/secsdk": ["@byted/secsdk"],
          "@byted/sec_sdk": ["@byted/sec_sdk"],
          "@byted-sdk/account-api": ["@byted-sdk/account-api"],
          "@dp/kura": ["@dp/kura"],
          zrender: ["zrender"],
          "react-libs": ["react"],
          prosemirror: ["prosemirror"],
          "emoji-mart": ["emoji-mart"],
          codemirror: ["codemirror"],
          "@xmldom": ["@xmldom"],
          xmlbuilder: ["xmlbuilder"],
          isomorphic: ["isomorphic"],
          html2canvas: ["html2canvas"],
          "byted-tea-sdk": ["byted-tea-sdk"],
          swiper: ["swiper"],
          "byted-video-uploader": ["byted-video-uploader"],
          "@isaac-im/static-idl": ["@isaac-im/static-idl"],
          "lib-sort": ["sortablejs", "@dnd-kit"],
        }),
      },
    },
  },
};
