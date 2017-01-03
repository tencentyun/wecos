# WeCOS —— 微信小程序 COS 瘦身解决方案

通过WeCOS，替换小程序项目中的静态图片资源地址且把文件提交到腾讯云对象存储服务（COS） ，减小小程序包大小，为开发者解决包大小的烦恼。

# 为什么你需要 WeCOS

  为了提升体验流畅度，编译后的代码包大小需小于 1MB ，大于 1MB 的代码包将上传失败。

这是小程序官方给出的限制，在小程序包中，占资源最大的莫过于图片资源，因此 WeCOS 提供了减小小程序包大小的能力，自动替换项目中静态图片资源的地址且上传至腾讯云COS，同时也可开启万象优图（CI）的图片压缩功能。

# 准备工作

开通COS服务并创建Bucket，如需开启图片压缩功能，需在万象优图创建同名Bucket

[对象存储服务COS传送门](https://console.qcloud.com/cos4/index)  

[万象优图传送门](https://console.qcloud.com/ci)

## 安装

```js
tnpm install -g wecos
```

## 配置

配置文件：如小程序目录为`app`，在与app目录同级下创建`wecos.config.json`文件。

`wecos.config.json`配置项例子：
```json
{
  "appDir": "./app",
  "backupDir": "./wecos_backup",
  "uploadFileSuffix": [
    ".jpg",
    ".png",
    ".gif"
  ],
  "uploadFileBlackList": [],
  "compress": false,
  "cos": {
    "appid": "1234567890",
    "bucketname": "wxapp",
    "folder": "/",
    "region": "wx",
    "secret_key": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "secret_id": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  }
}
```

| 配置项 | 类型 | 说明 |
| -- | -- | -- |
| appDir | *[String]* | 默认是 `./app`，小程序项目目录|
| backupDir | *[String]* | 默认是 `./wecos_backup`，静态图片上传 COS 后会在原项目目录中删除，这里指定原图片资源的备份目录|
| uploadFileSuffix | *[Array]* | 默认是 `[".jpg", ".png", ".gif"]`，上传的图片资源的后缀名|
| uploadFileBlackList | *[Array]* | 默认是 `[]`，指定不进行匹配的图片资源目录|
| compress | *[Boolean]* | 默认 false，是否开启压缩图片，如果开启，需要先在万象优图控制台创建 COS 同名 Bucket（万象优图创建Bucket有一定延时，需等待 Bucket 生效）。|
| cos | *[Object]* | 必填，填写需要上传到COS对应的 appid、bucketname、folder、region、secret_key、secret_id，部分信息可在此处查看 https://console.qcloud.com/cos4/secret|


## 使用

WeCOS提供了命令行方式

* 命令行执行 `wecos`
