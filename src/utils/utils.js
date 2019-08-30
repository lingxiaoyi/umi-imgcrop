export default {
  IsURL(str_url) {
    var strRegex =
      '^((https|http|ftp|rtsp|mms)?://)' +
      "?(([0-9a-z_!~*'().&=+$%-]+: )?[0-9a-z_!~*'().&=+$%-]+@)?" + //ftp的user@
      '(([0-9]{1,3}.){3}[0-9]{1,3}' + // IP形式的URL- 199.194.52.184
      '|' + // 允许IP和DOMAIN（域名）
      "([0-9a-z_!~*'()-]+.)*" + // 域名- www.
      '([0-9a-z][0-9a-z-]{0,61})?[0-9a-z].' + // 二级域名
      '[a-z]{2,6})' + // first level domain- .com or .museum
      '(:[0-9]{1,4})?' + // 端口- :80
      '((/?)|' + // a slash isn't required if there is no file name
      "(/[0-9a-z_!~*'().;?:@&=+$,%#-]+)+/?)$";
    var re = new RegExp(strRegex);
    //re.test()
    if (re.test(str_url)) {
      return true;
    } else {
      return false;
    }
  },
  //判断图片是否存在
  CheckImgExists(imgurl) {
    var ImgObj = new Image(); //判断图片是否存在
    ImgObj.src = imgurl;
    return new Promise((res, rej) => {
      //存在图片
      ImgObj.onload = function() {
        if (ImgObj.fileSize > 0 || (ImgObj.width > 0 && ImgObj.height > 0)) {
          res(true);
        } else {
          res(false);
        }
      };
      ImgObj.onerror = function() {
        res(false);
      };
    });
  },
};
