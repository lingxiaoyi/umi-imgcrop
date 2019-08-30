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

  cssLoaderOptions: {
    localIdentName: '[local]',
  },
};
