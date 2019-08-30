import React from 'react';
import { fabric } from 'fabric';
import { Upload, Button, Icon, Radio, Input, message, Modal } from 'antd';
//import axios from 'axios';
import './index.scss';
message.config({
  maxCount: 1
});
function loadBuffer(file, onload, onerror, onprogress) {
  var fr;
  fr = new FileReader();
  fr.onload = function() {
    onload(this.result);
  };
  fr.onerror = function() {
    if (onerror) {
      onerror(this.error);
    }
  };
  fr.readAsArrayBuffer(file);
}
class App extends React.Component {
  constructor(props) {
    super(props);
    this.handlerInputChange = this.handlerInputChange.bind(this);
    this.addFrames = this.addFrames.bind(this);
    this.reduceFrames = this.reduceFrames.bind(this);
    this.onChange = this.onChange.bind(this);
    this.previewEffect = this.previewEffect.bind(this);
    this.state = {
      clipPartNum: 3, //gif分的段数 默认3段
      optionArr: [], //初始化数据,initData
      previewGifVisible: false
    };
    this.bgColorArr = ['rgba(0,0,0,0.3)', 'rgb(4, 250, 37, 0.3)', 'rgb(41, 4, 250, .3)', 'rgb(41, 4, 10, .3)'];
    this.canvas_sprite = ''; //渲图片的canvas对象
    this.rects = [];
    this.texts = [];
    this.imgs = [];
    this.height = 300; //固定死
    this.width = 0; //通过实际宽高比计算出来的
    this.framesLength = 0;
  }

  componentDidMount() {
    this.canvas_sprite = new fabric.Canvas('merge');

    //this.setState({ previewGifVisible: false });
    this.initData();
    let that = this;
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
          obj.canvas.height - obj.getBoundingRect().height + obj.top - obj.getBoundingRect().top
        );
        obj.left = Math.min(
          obj.left,
          obj.canvas.width - obj.getBoundingRect().width + obj.left - obj.getBoundingRect().left
        );
      }
      let { top, left, width, height } = e.target;
      let { optionArr } = that.state;
      let optionArrIndex = optionArr.findIndex(function(item) {
        return item.text === e.target.text;
      });
      let optionArrNew = JSON.parse(JSON.stringify(optionArr));
      for (let index = 0; index < optionArrIndex; index++) {
        left -= optionArrNew[index].frames * that.width;
      }
      optionArrNew[optionArrIndex] = {
        ...optionArrNew[optionArrIndex],
        textWidth: width,
        textHeight: height,
        left,
        top
      };
      that.setState({
        optionArr: optionArrNew
      });
    });
  }
  initData() {
    let { clipPartNum } = this.state;

    this.clearCanvas();
    this.rects = new Array(clipPartNum).fill('');
    this.texts = new Array(clipPartNum).fill('');
    let optionArr = [];
    for (let index = 0; index < clipPartNum; index++) {
      optionArr.push({
        name: `第${index + 1}段`,
        frames: 2, //帧数
        fontSize: '45',
        text: `测试内容${index + 1}`,
        fontColor: 'red',
        textWidth: 0,
        textHeight: 0,
        left: 0,
        top: 0,
        imgWidth: '',
        imgHeight: '',
        textNumMax: 5, //最多文字数
        isAddText: 1 //是否添加文字
      });
    }
    this.setState(
      {
        optionArr: optionArr
      },
      () => {
        this.handlerClipPartNum();
      }
    );
  }
  componentWillUnmount() {}
  handlerInputChange(file) {
    let that = this;
    if (/gif$/.test(file.type)) {
      loadBuffer(
        file,
        function(buf) {
          var gif;
          gif = new window.Gif();
          gif.onparse = function() {
            setTimeout(function() {
              that.buildView(gif, file.name, true);
            }, 20);
          };
          gif.parse(buf);
        },
        function(e) {
          alert(e);
        }
      );
    } else {
      alert('"' + file.name + '" not GIF');
    }
  }
  onChange = e => {
    //console.log('radio checked', e.target.value);
    this.setState(
      {
        clipPartNum: e.target.value
      },
      () => {
        this.initData();
      }
    );
  };
  buildView(gif, fname, preRender) {
    let canvas_frame = '';
    let context = '';
    let frames = '';
    let canvas_sprite = this.canvas_sprite;
    let that = this;
    that.imgs = [];
    canvas_frame = document.createElement('canvas');
    canvas_frame.width = gif.header.width;
    canvas_frame.height = gif.header.height;
    context = canvas_frame.getContext('2d');
    frames = gif.createFrameImages(context, preRender, !preRender);
    canvas_sprite.clear();
    frames.forEach(function(frame, i) {
      let canvas_frame;
      canvas_frame = document.createElement('canvas');
      canvas_frame.width = frame.image.width;
      canvas_frame.height = frame.image.height;
      canvas_frame.getContext('2d').putImageData(frame.image, 0, 0);
      new fabric.Image.fromURL(canvas_frame.toDataURL(), function(img) {
        let width = img.height * (300 / img.height);
        that.width = width;
        img.set({ selectable: false, fill: '#000000', width: width, height: 300 });
        img.left = img.width * i;
        canvas_sprite.setHeight(img.height);
        canvas_sprite.setWidth(img.height * (i + 1));
        canvas_sprite.add(img);
        that.imgs.push(img);
        //加线进来
        let Line = new fabric.Line([img.height * i, 0, img.height * i, img.height], {
          selectable: false,
          fill: '#000000',
          stroke: 'rgba(0,0,0,0.8)' //笔触颜色
        });
        canvas_sprite.add(Line);
        canvas_sprite.renderAll();
        that.framesLength = frames.length; //图片总帧数
        if (i === frames.length - 1) that.handlerClipPartNum(); //加载为异步,必须在图片加载完成
      });
    });
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
        optionArr: optionArrNew
      },
      () => {
        this.renderFramesInit();
      }
    ); //分配完帧数,渲染矩形分割区和文字
  }
  //增加矩形 文字到各自的段数上
  renderFramesInit() {
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
        selectable: false
      });
      rects[i] = rect;
      canvas_sprite.add(rect);

      let text = new fabric.Text(item.text, {
        left: left, //距离画布左侧的距离，单位是像素
        top: 0, //距离画布上边的距离
        fontSize: item.fontSize, //文字大小
        lockRotation: true,
        fill: item.fontColor,
        index: i
      });
      texts[i] = text;
      canvas_sprite.add(text);
      left += item.frames * this.width;
    });
  }
  clearCanvas() {
    let canvas_sprite = this.canvas_sprite;
    this.rects.forEach(function(item, i) {
      console.log('item', item);
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
        optionArr: optionArrNew
      },
      () => {
        this.renderFramesInit();
      }
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
        optionArr: optionArrNew
      },
      () => {
        this.renderFramesInit();
      }
    );
  }
  previewEffect() {
    this.setState({ previewGifVisible: true }, () => {
      clearTimeout(this.t2);
      this.t2 = setTimeout(() => {
        this.canvas_previewGif = new fabric.Canvas('previewGif');
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
      //console.log('this.imgs[index]', this.imgs[index]);
      let img = fabric.util.object.clone(this.imgs[index]);
      let text = fabric.util.object.clone(this.texts[textIndex]);
      await this.addGifFrame(canvas, img, text, textIndex);

      if (index >= framesLength - 1) {
        this.composeGifT = setTimeout(() => {
          this.composeGif();
        }, 10);
      }
    }
  }
  addGifFrame(canvas, img, text, textIndex) {
    img.left = 0;
    img.top = 0;
    let optionArr = this.state.optionArr;

    text.left = optionArr[textIndex].left;
    text.top = optionArr[textIndex].top;
    clearTimeout(this.t);
    return new Promise(res => {
      this.t = setTimeout(() => {
        canvas.clear();
        canvas.add(img /* this.imgs[0] */);
        canvas.add(text /* this.texts[0] */);
        canvas.renderAll();
        res();
      }, 200);
    });
  }
  render() {
    let that = this;
    const props = {
      beforeUpload(file) {
        that.handlerInputChange(file);
      }
    };
    const { optionArr, previewGifVisible } = this.state;
    return (
      <div id='main'>
        <canvas id='merge' width='2000' height='300' />
        <div className='box'>
          <div>
            <Upload {...props}>
              <Button>
                <Icon type='upload' /> Click to Upload
              </Button>
            </Upload>
          </div>
          <div>
            <Radio.Group onChange={this.onChange} value={this.state.clipPartNum}>
              <Radio value={2}>二段</Radio>
              <Radio value={3}>三段</Radio>
              <Radio value={4}>四段</Radio>
            </Radio.Group>
          </div>
          <div className='btn'>
            <Button type='primary' onClick={this.previewEffect}>
              预览效果
            </Button>
          </div>
        </div>
        <div className='option'>
          {optionArr.map((item, i) => {
            return (
              <div key={i} className='option-li'>
                <div className='row'>
                  <div className='h3'>{item.name} </div>
                </div>
                <div className='row'>
                  <div className='h3'>帧数</div>
                  <Input placeholder={item.frames} defaultValue={item.frames} value={item.frames} />
                </div>
                <div className='row'>
                  <div className='h3'>加减帧</div>
                  <Button type='primary' onClick={this.addFrames.bind(this, i)}>
                    +
                  </Button>
                  <Button type='primary' onClick={this.reduceFrames.bind(this, i)}>
                    -
                  </Button>
                </div>
                <div className='row'>
                  <div className='h3'>文字内容</div>
                  <Input placeholder={item.text + (i + 1)} defaultValue={item.text + (i + 1)} />
                </div>
                <div className='row'>
                  <div className='h3'>最大字数</div>
                  <Input placeholder={item.textNumMax} defaultValue={item.textNumMax} />
                </div>
                <div className='row'>
                  <div className='h3'>是否添加文字</div>
                  <div className='radio-group'>
                    <Radio.Group onChange={this.handerChangeisAddText} value={item.isAddText}>
                      <Radio value={1}>是</Radio>
                      <Radio value={0}>否</Radio>
                    </Radio.Group>
                  </div>
                </div>
                <div className='row'>
                  <div className='h3'>字号</div>
                  <Input placeholder={item.fontSize} defaultValue={item.fontSize} />
                </div>
                <div className='row'>
                  <div className='h3'>起始坐标</div>
                  <div className='h4'>
                    {item.left},{item.top}
                  </div>
                </div>
                <div className='row'>
                  <div className='h3'>结束坐标</div>
                  <div className='h4'>
                    {item.left + item.textWidth},{item.top + item.textHeight}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <Modal
          title='效果'
          visible={previewGifVisible}
          footer={null}
          onCancel={() => {
            this.setState({ previewGifVisible: false });
          }}
          wrapClassName='preview-gif-modal'
        >
          <canvas id='previewGif' width='300' height='300' />
        </Modal>
      </div>
    );
  }
}

export default App;
