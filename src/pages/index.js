import React from 'react';
import reactCSS from 'reactcss';
import { fabric } from 'fabric';
import _ from 'lodash';
import { Upload, Icon, Button, Radio, Input, message, Modal, Spin } from 'antd';
import { SketchPicker } from 'react-color';
import utils from '@/utils/utils.js';
import SuperGif from 'libgif';
import gifshot from 'gifshot';
import styles from './index.scss';
message.config({
  maxCount: 1,
});
class App extends React.Component {
  constructor(props) {
    super(props);
    this.addFrames = this.addFrames.bind(this);
    this.reduceFrames = this.reduceFrames.bind(this);
    this.changeOptionArr = this.changeOptionArr.bind(this);
    this.changeTextsSetting = this.changeTextsSetting.bind(this);
    this.updateObject = this.updateObject.bind(this);
    this.changeActiveObjectValue = this.changeActiveObjectValue.bind(this);
    this.previewEffect = this.previewEffect.bind(this);
    this.state = {
      clipPartNum: 3, //gif分的段数 默认3段
      optionArr: [], //初始化数据,initOptionArrData
      previewGifVisible: false,
      spinVisible: false,
      timeinterval: 0.1, //最小支持0.02
      gifUrl:
        'https://5b0988e595225.cdn.sohucs.com/images/20190813/f181cb0e5906476e893019ec50cd6615.gif', //备用地址2 https://static001.geekbang.org/resource/image/28/70/28959e4de450ba38b84fd11c5b058570.gif
      previewGifImgUrl: '',
      isPreviewEffect: true, //true预览图片 false生成图片2种类型
      displayColorPicker: [false, false, false, false],
      textsSetting: [
        {
          value: '统一替换',
          key: 'text',
          name: '文字内容',
        },
        {
          value: 40,
          key: 'fontSize',
          name: '字号',
        },
        {
          value: '#000000',
          key: 'fill',
          name: '文字颜色',
        },
        {
          value: 0,
          key: 'left',
          name: '左边距',
        },
        {
          value: 0,
          key: 'top',
          name: '上边距',
        },
      ],
      imgWidth: 300,
    };
    this.bgColorArr = [
      'rgba(0,0,0,0.2)',
      'rgb(4, 250, 37, 0.2)',
      'rgb(41, 4, 250, .2)',
      'rgb(41, 4, 10, .2)',
    ];
    this.canvas_sprite = ''; //渲图片的canvas对象
    this.rects = [];
    this.texts = [];
    this.imgs = [];
    this.toDataURL = []; //生成的每一个图片帧
    this.height = 300; //固定死
    this.width = 0; //通过实际宽高比计算出来的
    this.framesLength = 0;
  }

  componentDidMount() {
    this.canvas_sprite = new fabric.Canvas('merge');
    this.pre_load_gif(this.state.gifUrl);
    //this.initOptionArrData();
    this.addEventListener();
  }
  addEventListener() {
    let that = this;
    let throttlechangeActiveObjectValue = _.throttle(that.changeActiveObjectValue, 100);
    this.canvas_sprite.on('object:moving', function(e) {
      var obj = e.target;
      // if object is too big ignore
      if (obj.currentHeight > obj.canvas.height || obj.currentWidth > obj.canvas.width) {
        return;
      }
      obj.setCoords();
      // top-left  corner
      if (obj.getBoundingRect().top < 0 || obj.getBoundingRect().left < 0) {
        obj.top = Math.max(obj.top, obj.top - obj.getBoundingRect().top);
        obj.left = Math.max(obj.left, obj.left - obj.getBoundingRect().left);
      }
      // bot-right corner
      if (
        obj.getBoundingRect().top + obj.getBoundingRect().height > obj.canvas.height ||
        obj.getBoundingRect().left + obj.getBoundingRect().width > obj.canvas.width
      ) {
        obj.top = Math.min(
          obj.top,
          obj.canvas.height - obj.getBoundingRect().height + obj.top - obj.getBoundingRect().top,
        );
        obj.left = Math.min(
          obj.left,
          obj.canvas.width - obj.getBoundingRect().width + obj.left - obj.getBoundingRect().left,
        );
      }
      throttlechangeActiveObjectValue();
    });

    this.canvas_sprite.on('object:scaling', function(e) {
      throttlechangeActiveObjectValue();
    });
    this.canvas_sprite.on('object:modified', function(e) {
      throttlechangeActiveObjectValue();
    });
  }
  changeActiveObjectValue() {
    let activeObject = this.canvas_sprite.getActiveObject();
    let index = activeObject.index;
    let newOptionArr = _.clone(this.state.optionArr);
    let arr = ['left', 'top', 'text', 'fontSize', 'fill', 'scaleY'];
    let left = activeObject.left;
    let optionArrIndex = activeObject.index;
    arr.forEach(item => {
      if (item === 'fontSize') {
        newOptionArr[index][item] = activeObject[item] * activeObject.scaleY;
      } else if (item === 'left') {
        for (let index = 0; index < optionArrIndex; index++) {
          left -= newOptionArr[index].frames * this.width;
        }
        newOptionArr[index][item] = left;
      } else {
        newOptionArr[index][item] = activeObject[item];
      }
    });
    this.setState({
      optionArr: newOptionArr,
    });
  }
  initOptionArrData() {
    let { clipPartNum } = this.state;
    this.rects = new Array(clipPartNum).fill('');
    this.texts = new Array(clipPartNum).fill('');
    let optionArr = [];
    for (let index = 0; index < clipPartNum; index++) {
      optionArr.push({
        fontSize: '40',
        text: `第${index + 1}条文字内容`,
        fill: '#333333',
        left: 0,
        top: 0,
        name: `第${index + 1}段`,
        frames: 2, //帧数
        scaleY: 1,
        imgWidth: '',
        imgHeight: '',
        textWidth: 0,
        textHeight: 0,
        textNumMax: 5, //最多文字数
        isAddText: 1, //是否添加文字
      });
    }
    this.setState(
      {
        optionArr: optionArr,
      },
      () => {
        this.handlerClipPartNum();
      },
    );
  }
  //添加矩形 文字到各自的段数上
  addObjectsToCanvas() {
    const { optionArr } = this.state;
    let rects = this.rects;
    let texts = this.texts;
    let canvas_sprite = this.canvas_sprite;
    let left = 0;
    optionArr.forEach((item, i) => {
      let rect = new fabric.Rect({
        left: left, //距离画布左侧的距离，单位是像素
        top: 0, //距离画布上边的距离
        fill: this.bgColorArr[i], //填充的颜色
        width: item.frames * this.width, //方形的宽度
        height: this.height, //方形的高度
        selectable: false,
      });
      rects[i] = rect;
      canvas_sprite.add(rect);
      let text = new fabric.Textbox(item.text, {
        left: left, //距离画布左侧的距离，单位是像素
        top: 0, //距离画布上边的距离
        fontSize: item.fontSize, //文字大小
        //lockRotation: true,
        fill: item.fill,
        index: i,
        editable: true,
        scaleY: item.scaleY,
        lockUniScaling: true, //只能等比缩放
        borderColor: '#ff0000',
        cornerColor: '#ff0000',
      });
      texts[i] = text;
      canvas_sprite.add(text);
      left += item.frames * this.width;
    });
    canvas_sprite.setActiveObject(texts[0]);
  }
  changeOptionArr(i, type, e) {
    let newOptionArr = _.clone(this.state.optionArr);
    if (type === 'fill') {
      newOptionArr[i][type] = e.hex;
    } else {
      newOptionArr[i][type] = e.target.value;
    }
    this.setState(
      {
        optionArr: newOptionArr,
      },
      () => {
        this.updateObject(i);
      },
    );
  }
  changeTextsSetting(i, type, e) {
    let newOptionArr = _.clone(this.state.optionArr);
    let newTextsSetting = _.clone(this.state.textsSetting);
    if (type === 'fill') {
      newTextsSetting[i].value = e.hex;
    } else {
      newTextsSetting[i].value = e.target.value;
    }
    newOptionArr.forEach((item, i2) => {
      if (type === 'fill') {
        newOptionArr[i2][type] = e.hex;
      } else {
        newOptionArr[i2][type] = e.target.value;
      }
    });
    this.setState(
      {
        optionArr: newOptionArr,
        textsSetting: newTextsSetting,
      },
      () => {
        this.state.optionArr.forEach((item, i) => {
          this.updateObject(i);
        });
      },
    );
  }
  updateObject(i) {
    let texts = this.texts;
    let optionArr = this.state.optionArr;
    let left = optionArr[i].left / 1;
    optionArr.forEach((item, i2) => {
      if (i2 < i) {
        left += item.frames * this.width;
      }
    });
    texts[i].set({
      ...optionArr[i],
      width: '',
      fontSize: optionArr[i].fontSize / optionArr[i].scaleY,
      left,
      top: optionArr[i].top / 1,
    });
    this.canvas_sprite.renderAll();
  }
  //分配每段的帧数
  handlerClipPartNum() {
    let { clipPartNum, optionArr } = this.state;
    let length = this.framesLength;
    let residue = length % clipPartNum;
    let average = (length - residue) / clipPartNum; //整除值
    let optionArrNew = JSON.parse(JSON.stringify(optionArr));
    for (let index = 0; index < clipPartNum; index++) {
      if (index === 1) {
        optionArrNew[index].frames = average + residue;
      } else {
        optionArrNew[index].frames = average;
      }
    }
    this.setState(
      {
        optionArr: optionArrNew,
      },
      () => {
        this.addObjectsToCanvas();
        this.setState({
          spinVisible: false,
        });
      },
    ); //分配完帧数,渲染矩形分割区和文字
  }
  //清空画布
  clearCanvas() {
    let canvas_sprite = this.canvas_sprite;
    /* let Objects = canvas_sprite.getObjects();
    Objects.forEach(element => {
      canvas_sprite.remove(element);
    }); */
    this.rects.forEach(function(item, i) {
      if (item) {
        canvas_sprite.remove(item);
      }
    });
    this.texts.forEach(function(item, i) {
      if (item) {
        canvas_sprite.remove(item);
      }
    });
  }
  addFrames(i) {
    let { clipPartNum, optionArr } = this.state;
    let optionArrNew = JSON.parse(JSON.stringify(optionArr));
    if (i === clipPartNum - 1) {
      if (optionArrNew[0].frames === 1) {
        message.warning('不能再加了已经最大了');
        return;
      }
      optionArrNew[0].frames--;
    } else {
      if (optionArrNew[i + 1].frames === 1) {
        message.warning('不能再加了已经最大了');
        return;
      }
      optionArrNew[i + 1].frames--;
    }
    optionArrNew[i].frames++;
    this.clearCanvas();
    this.setState(
      {
        optionArr: optionArrNew,
      },
      () => {
        this.addObjectsToCanvas();
      },
    );
  }
  reduceFrames(i) {
    let { clipPartNum, optionArr } = this.state;
    let optionArrNew = JSON.parse(JSON.stringify(optionArr));
    if (optionArrNew[i].frames === 1) {
      message.warning('不能再减了已经最小了');
      return;
    }
    optionArrNew[i].frames--;
    if (i === clipPartNum - 1) {
      optionArrNew[0].frames++;
    } else {
      optionArrNew[i + 1].frames++;
    }
    this.clearCanvas();
    this.setState(
      {
        optionArr: optionArrNew,
      },
      () => {
        this.addObjectsToCanvas();
      },
    );
  }
  //加载图片
  async pre_load_gif(gif_source) {
    if (!utils.IsURL(gif_source)) {
      message.error(`链接地址错误,请仔细检查`, 2);
      return;
    }
    if (gif_source.indexOf('.gif') === -1) {
      message.error(`请输入gif图片地址`, 2);
      return;
    }
    let res = await utils.CheckImgExists(gif_source);
    if (!res) {
      message.error(`图片加载失败,请输入正确的图片链接地址`, 2);
      return;
    }
    try {
      this.setState({
        spinVisible: true,
      });
      const gifImg = document.createElement('img');
      // gif库需要img标签配置下面两个属性
      gifImg.setAttribute('rel:animated_src', gif_source);
      gifImg.setAttribute('rel:auto_play', '0');
      const div = document.createElement('div');
      div.appendChild(gifImg); //防止报错
      // 新建gif实例
      var rub = new SuperGif({ gif: gifImg });
      rub.load(() => {
        var img_list = [];
        for (let i = 1; i <= rub.get_length(); i++) {
          // 遍历gif实例的每一帧
          rub.move_to(i);
          // 将每一帧的canvas转换成file对象
          let cur_file = this.convertCanvasToImage(rub.get_canvas(), `gif-${i}`);
          img_list.push({
            file_name: cur_file.name,
            url: URL.createObjectURL(cur_file),
            file: cur_file,
          });
        }
        this.img_list = img_list;
        this.initOptionArrData();
        this.buildView();
      });
    } catch (error) {
      message.error(`出错了${error}`, 2);
      this.setState({
        spinVisible: false,
      });
    }
  }
  buildView() {
    let canvas_sprite = this.canvas_sprite;
    let that = this;
    that.imgs = [];
    canvas_sprite.clear();
    this.img_list.forEach(function(frame, i) {
      new fabric.Image.fromURL(frame.url, function(img) {
        let width = 300;
        let scale = width / img.width;
        let height = img.height * scale;
        that.width = width;
        that.height = height;
        img.set({
          selectable: false,
          fill: 'rgba(0,0,0,0)',
          width: img.width,
          height: img.height,
          scaleX: scale,
          scaleY: scale,
          originX: 'left',
          originY: 'top',
        });
        img.left = img.width * scale * i;
        canvas_sprite.setHeight(height);
        canvas_sprite.setWidth(width * (i + 1));
        canvas_sprite.add(img);
        that.imgs.push(img);
        //加线进来
        let Line = new fabric.Line([width * i, 0, width * i, height], {
          selectable: false,
          fill: '#000000',
          stroke: 'rgba(0,0,0,0.8)', //笔触颜色
        });
        canvas_sprite.add(Line);
        canvas_sprite.renderAll();
        that.framesLength = that.img_list.length; //图片总帧数
        if (i === that.img_list.length - 1) that.handlerClipPartNum(); //加载为异步,必须在图片加载完成
      });
    });
  }
  convertCanvasToImage(canvas, filename) {
    return this.dataURLtoFile(canvas.toDataURL('image/png'), filename);
  }
  dataURLtoFile(dataurl, filename) {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    var n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  }
  async pre_load_gif_from_upload(gif_source) {
    // 判断是gif格式则交给this.pre_load_gif函数处理
    if (!/(image\/gif)/.test(gif_source.type)) {
      message.error(`请上传gif格式的图片`, 2);
      return;
    }
    try {
      this.setState({
        spinVisible: true,
      });
      const gifImg = document.createElement('img');
      // gif库需要img标签配置下面两个属性
      gifImg.setAttribute('rel:animated_src', URL.createObjectURL(gif_source));
      gifImg.setAttribute('rel:auto_play', '0');
      const div = document.createElement('div');
      div.appendChild(gifImg); //防止报错
      // 新建gif实例

      var rub = new SuperGif({ gif: gifImg });
      rub.load(() => {
        var img_list = [];
        for (let i = 1; i <= rub.get_length(); i++) {
          // 遍历gif实例的每一帧
          rub.move_to(i);
          // 将每一帧的canvas转换成file对象
          let cur_file = this.convertCanvasToImage(rub.get_canvas(), `gif-${i}`);
          img_list.push({
            file_name: cur_file.name,
            url: URL.createObjectURL(cur_file),
            file: cur_file,
          });
        }
        this.img_list = img_list;
        this.initOptionArrData();
        this.buildView();
      });
    } catch (error) {
      message.error(`出错了${error}`, 2);
      this.setState({
        spinVisible: false,
      });
    }
  }
  //预览图片
  previewEffect(status) {
    if (!this.framesLength) {
      message.error(`请先添加gif图片`, 2);
      return;
    }
    this.setState({
      spinVisible: true,
      isPreviewEffect: status,
    });
    this.setState({ previewGifVisible: true }, () => {
      clearTimeout(this.t2);
      this.t2 = setTimeout(() => {
        this.canvas_previewGif = new fabric.Canvas('previewGif', {
          backgroundColor: '#ffffff',
          width: this.width,
          height: this.height,
        });
        this.composeGif();
      }, 10);
    });
  }
  async composeGif() {
    let canvas = this.canvas_previewGif;
    let framesLength = this.framesLength;
    let optionArr = this.state.optionArr;
    let textIndex = 0;
    let frames = [];
    let length = 0;
    this.toDataURL = [];
    for (let index = 0; index < optionArr.length; index++) {
      length += optionArr[index].frames;
      frames.push(length);
    }
    clearTimeout(this.composeGifT);
    for (let index = 0; index < framesLength; index++) {
      textIndex = frames.findIndex((item, index2) => {
        if (index2 === 0) {
          return index + 1 <= item;
        } else {
          return index + 1 <= item && index + 1 > frames[index2 - 1];
        }
      });
      let img = fabric.util.object.clone(this.imgs[index]);
      let text = fabric.util.object.clone(this.texts[textIndex]);
      await this.addGifFrame(canvas, img, text, textIndex);
      if (this.state.isPreviewEffect) {
        if (index >= framesLength - 1) {
          this.composeGifT = setTimeout(() => {
            this.composeGif();
            this.setState({
              spinVisible: false,
            });
          }, 10);
        }
      }
    }
    if (!this.state.isPreviewEffect) {
      this.createGIF(); //生成gif
    }
  }
  addGifFrame(canvas, img, text, textIndex) {
    img.left = 0;
    img.top = 0;
    let optionArr = this.state.optionArr;
    text.left = optionArr[textIndex].left / 1;
    text.top = optionArr[textIndex].top / 1;
    let that = this;
    clearTimeout(this.t);
    return new Promise(res => {
      that.t = setTimeout(() => {
        canvas.clear();
        canvas.set({
          backgroundColor: '#ffffff',
        });
        canvas.add(img);
        canvas.add(text);
        canvas.renderAll();
        if (!that.state.isPreviewEffect) {
          that.toDataURL.push(canvas.toDataURL('png'));
        }
        res();
      }, that.state.timeinterval * 1000);
    });
  }
  createGIF() {
    let that = this;
    if (!that.toDataURL.length) {
      message.error(`请先添加gif图片`, 2);
      return;
    }
    gifshot.createGIF(
      {
        images: this.toDataURL,
        gifWidth: this.state.imgWidth,
        // Desired height of the image
        gifHeight: (this.state.imgWidth / this.width) * this.height,
        interval: this.state.timeinterval / 1,
        //frameDuration: this.state.timeinterval / 1,
      },
      function(obj) {
        if (!obj.error) {
          let image = obj.image;
          that.setState({ previewGifImgUrl: image });
          /* let animatedImage = document.createElement('img');
          animatedImage.src = image;
          document.body.appendChild(animatedImage); */
        } else {
          message.error(`图片生成错误,请重新尝试`, 2);
        }
        that.setState({
          spinVisible: false,
        });
      },
    );
  }
  render() {
    let that = this;
    const props = {
      beforeUpload(file) {
        that.pre_load_gif_from_upload(file);
      },
    };
    const {
      optionArr,
      previewGifVisible,
      timeinterval,
      gifUrl,
      spinVisible,
      previewGifImgUrl,
      isPreviewEffect,
      displayColorPicker,
    } = this.state;
    return (
      <div id="main">
        <canvas id="merge" width="2000" height="300" />
        <div className="box">
          <div>
            <Upload {...props}>
              <Button>
                <Icon type="upload" /> 上传图片
              </Button>
            </Upload>
          </div>
          <div className={styles['url-input']}>
            <Input
              addonBefore="图片url"
              placeholder={gifUrl}
              defaultValue={gifUrl}
              onChange={event => {
                this.setState(
                  {
                    gifUrl: event.target.value,
                  },
                  () => {
                    this.pre_load_gif(this.state.gifUrl);
                  },
                );
              }}
            />
          </div>
          {/* <div className="btn">
            <Button
              type="primary"
              onClick={() => {
                this.initOptionArrData();
              }}
            >
              添加图片
            </Button>
          </div> */}
          <div>
            <Radio.Group
              onChange={e => {
                this.clearCanvas();
                this.setState(
                  {
                    clipPartNum: e.target.value,
                  },
                  () => {
                    this.initOptionArrData();
                  },
                );
              }}
              value={this.state.clipPartNum}
            >
              <Radio value={2}>二段</Radio>
              <Radio value={3}>三段</Radio>
              <Radio value={4}>四段</Radio>
            </Radio.Group>
          </div>
          <div className="input-timeinterval">
            <Input
              addonBefore="帧间隔"
              placeholder={timeinterval}
              defaultValue={timeinterval}
              onBlur={event => {
                if (event.target.value < 0.02) {
                  message.error(`生成图片最小仅支持0.02数值,预览效果可以输入任何值`, 3);
                }
              }}
              onChange={event => {
                this.setState({
                  timeinterval: event.target.value,
                });
              }}
            />
          </div>
          <div className="input-timeinterval">
            <Input
              addonBefore="图片大小"
              placeholder={this.state.imgWidth}
              defaultValue={this.state.imgWidth}
              onChange={event => {
                this.setState({
                  imgWidth: event.target.value,
                });
              }}
            />
          </div>
          <div className="btn">
            <Button type="primary" onClick={this.previewEffect.bind(this, true)}>
              预览效果
            </Button>
          </div>
          <div className="btn">
            <Button type="primary" onClick={this.previewEffect.bind(this, false)}>
              生成图片
            </Button>
          </div>
        </div>
        <div className="option">
          {optionArr.map((item, i) => {
            const styles = reactCSS({
              default: {
                color: {
                  width: '36px',
                  height: '14px',
                  borderRadius: '2px',
                  background: `${item.fill}`,
                },
                swatch: {
                  padding: '5px',
                  background: '#fff',
                  borderRadius: '1px',
                  boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
                  display: 'inline-block',
                  cursor: 'pointer',
                },
                popover: {
                  position: 'absolute',
                  zIndex: '2',
                },
                cover: {
                  position: 'fixed',
                  top: '0px',
                  right: '0px',
                  bottom: '0px',
                  left: '0px',
                },
              },
            });
            return (
              <div key={i} className="option-li">
                <div className="row">
                  <div className="h3">{item.name} </div>
                </div>
                <div className="row">
                  <div className="h3">帧数</div>
                  <Input
                    placeholder={item.frames}
                    defaultValue={item.frames}
                    value={item.frames}
                    disabled
                  />
                </div>
                <div className="row">
                  <div className="h3">加减帧</div>
                  <Button type="primary" onClick={this.addFrames.bind(this, i)}>
                    +
                  </Button>
                  <Button type="primary" onClick={this.reduceFrames.bind(this, i)}>
                    -
                  </Button>
                </div>
                <div className="row">
                  <div className="h3">文字内容</div>
                  <Input
                    value={item.text}
                    defaultValue={item.text}
                    onChange={this.changeOptionArr.bind(this, i, 'text')}
                  />
                </div>
                <div className="row">
                  <div className="h3">字号</div>
                  <Input
                    value={item.fontSize}
                    defaultValue={item.fontSize}
                    onChange={this.changeOptionArr.bind(this, i, 'fontSize')}
                  />
                </div>
                <div className="row">
                  <div className="h3">文字颜色</div>
                  <div>
                    <div
                      style={styles.swatch}
                      onClick={() => {
                        let displayColorPickerNew = _.cloneDeep(displayColorPicker);
                        displayColorPickerNew[i] = true;
                        this.setState({
                          displayColorPicker: displayColorPickerNew,
                        });
                      }}
                    >
                      <div style={styles.color} />
                    </div>
                    {displayColorPicker[i] ? (
                      <div style={styles.popover}>
                        <div
                          style={styles.cover}
                          onClick={() => {
                            this.setState({
                              displayColorPicker: [false, false, false, false],
                            });
                          }}
                        />
                        <SketchPicker
                          color={item.fill}
                          onChange={this.changeOptionArr.bind(this, i, 'fill')}
                        />
                      </div>
                    ) : null}
                  </div>
                </div>
                <div className="row">
                  <div className="h3">左边距</div>
                  <Input
                    value={item.left}
                    defaultValue={item.left}
                    onChange={this.changeOptionArr.bind(this, i, 'left')}
                  />
                </div>
                <div className="row">
                  <div className="h3">上边距</div>
                  <Input
                    value={item.top}
                    defaultValue={item.top}
                    onChange={this.changeOptionArr.bind(this, i, 'top')}
                  />
                </div>
                {/* <div className="row">
                  <div className="h3">起始坐标</div>
                  <div className="h4">
                    {item.left},{item.top}
                  </div>
                </div> */}
                {/* <div className="row">
                  <div className="h3">结束坐标</div>
                  <div className="h4">
                    {item.left + item.textWidth},{item.top + item.textHeight}
                  </div>
                </div> */}
              </div>
            );
          })}
          {!!optionArr.length && (
            <div className="option-li">
              <div className="row">
                <h3>文字属性统一编辑</h3>
              </div>
              {this.state.textsSetting.map((item, i) => {
                if (item.key === 'fill') {
                  const styles = reactCSS({
                    default: {
                      color: {
                        width: '36px',
                        height: '14px',
                        borderRadius: '2px',
                        background: `${item.value}`,
                      },
                      swatch: {
                        padding: '5px',
                        background: '#fff',
                        borderRadius: '1px',
                        boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
                        display: 'inline-block',
                        cursor: 'pointer',
                      },
                      popover: {
                        position: 'absolute',
                        zIndex: '2',
                      },
                      cover: {
                        position: 'fixed',
                        top: '0px',
                        right: '0px',
                        bottom: '0px',
                        left: '0px',
                      },
                    },
                  });
                  return (
                    <div className="row" key={item.key}>
                      <div className="h3">字体颜色</div>
                      <div>
                        <div
                          style={styles.swatch}
                          onClick={() => {
                            this.setState({
                              showColorPicker: true,
                            });
                          }}
                        >
                          <div style={styles.color} />
                        </div>
                        {this.state.showColorPicker ? (
                          <div style={styles.popover}>
                            <div
                              style={styles.cover}
                              onClick={() => {
                                this.setState({
                                  showColorPicker: false,
                                });
                              }}
                            />
                            <SketchPicker
                              color={item.value}
                              onChange={this.changeTextsSetting.bind(this, i, item.key)}
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                } else {
                  return (
                    <div className="row" key={item.key}>
                      <div className="h3">{item.name}</div>
                      <Input
                        value={item.value}
                        defaultValue={item.value}
                        onChange={this.changeTextsSetting.bind(this, i, item.key)}
                      />
                    </div>
                  );
                }
              })}
            </div>
          )}
        </div>
        <Modal
          title="效果"
          visible={previewGifVisible}
          footer={null}
          onCancel={() => {
            this.setState({ previewGifVisible: false });
            clearTimeout(this.t); //动画关闭就把动画删掉,要不然会报错
          }}
          wrapClassName="preview-gif-modal"
        >
          <div className={isPreviewEffect ? '' : 'hide'}>
            <canvas id="previewGif" width="300" height="300" />
          </div>
          {!isPreviewEffect && (
            <div>
              <img
                id="previewGifImg"
                src={previewGifImgUrl}
                alt=""
                style={{
                  width: this.state.imgWidth / 1,
                  height: (this.state.imgWidth / this.width) * this.height,
                }}
              />
              <div className="btn-createGIF">
                <a href={previewGifImgUrl} download={previewGifImgUrl}>
                  <Button type="primary" onClick={() => {}}>
                    下载图片
                  </Button>
                </a>
              </div>
            </div>
          )}
        </Modal>
        {spinVisible && (
          <div className={styles['mask-wrapper']}>
            <Spin size="large" />
          </div>
        )}
      </div>
    );
  }
}

export default App;
