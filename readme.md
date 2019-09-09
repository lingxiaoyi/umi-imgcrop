# gif切图片帧工具

- 将用户上传gif动图分解成多张帧图片
- input自行上传gif图片[体验地址](https://lingxiaoyi.github.io/umi-imgcrop)
- 复制gif图片链接地址[体验地址](https://lingxiaoyi.github.io/umi-imgcrop/#/gifUrl)

## 使用

- 下载项目代码

```bash
git clone https://github.com/lingxiaoyi/umi-imgcrop.git
```

- 进入目录安装依赖，国内用户推荐使用 cnpm 进行加速

```bash
npm i
```

或借助cnpm加速

- 启动本地服务器

```bash
npm start
```

## 属性

- 每帧时间间隔 是指生成的gif每一帧图片的持续时间，单位(s)
- 二段 三段 四段是指将gif图分成的段数，并可修改每一段对应的文字和图片帧数
- 坐标功能暂时是提供给后端使用，因为本司本工具只是用来获取坐标功能，并提供给后端使用的

## 后续

- todo...

## 备注

- 图片地址请输入https格式
- 分解完图片后，请拖动左右滚动条查看全部图片
- 分解gif图片链接功能不支持跨域功能，如果发现所填图片地址没问题，但是发现图片就是加载解不出来，F12进入调试台看一下，多半是图片跨域报错了，解决方法是下载图片出来，再使用input上传功能
- 本人完全是在谷歌浏览器开发出来的，没有考虑任何兼容问题，请在谷歌浏览器测试
- 因为代码体验部署在在github page上，所以打开会感到有些卡顿，如需快速打开，请自行解决vpn问题
- 分帧的图片和生成的图片宽度固定为300px，后期可以添加动态的大小
- 点击生成图片后，可以将生成图片下载出来使用，如有任何版权问题，本库概不负责
- 如有其它问题请联系我

## 感谢

特别感谢一下三个库，才让我实现这么酷炫的功能

- [fabric.js](http://fabricjs.com/docs/fabric.Canvas.html)
- [buzzfeed/libgif-js](https://github.com/buzzfeed/libgif-js)
- [yahoo/gifshot](https://github.com/yahoo/gifshot)
  