// ref: https://umijs.org/config/
export default {
  treeShaking: true,
  plugins: [
    // ref: https://umijs.org/plugin/umi-plugin-react.html
    [
      'umi-plugin-react',
      {
        antd: true,
        dva: false,
        dynamicImport: false,
        title: 'umi-imgcrop',
        dll: false,

        routes: {
          exclude: [/components\//],
        },
      },
    ],
  ],
  sass: {},
  outputPath: './build',
  publicPath: '/umi-imgcrop/',
  base: '/umi-imgcrop/',
  history: 'hash',
  //runtimePublicPath: true,
  copy: [
    {
      from: `${__dirname}/src/assets/favicon.ico`,
      to: `${__dirname}/build/assets/favicon.ico`,
    },
  ],
  cssLoaderOptions: {
    localIdentName: '[local]',
  },
};
