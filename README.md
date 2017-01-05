# WeCOS —— 微信小程序 COS 瘦身解决方案

通过WeCOS，替换小程序项目中的静态图片资源地址且把文件提交到腾讯云对象存储服务（COS） ，减小小程序包大小，为开发者解决包大小的烦恼。

## 为什么你需要 WeCOS

    为了提升体验流畅度，编译后的代码包大小需小于 1MB ，大于 1MB 的代码包将上传失败。

这是小程序官方给出的限制，在小程序包中，占资源最大的莫过于图片资源，因此 WeCOS 提供了减小小程序包大小的能力，自动替换项目中静态图片资源的地址且上传至腾讯云COS，同时也可开启万象优图（CI）的图片压缩功能。

## 准备工作

开通COS服务并创建Bucket，如需开启图片压缩功能，需在万象优图创建同名Bucket

* [对象存储服务COS传送门](https://www.qcloud.com/product/cos)  

* [万象优图传送门](https://www.qcloud.com/product/ci)

## 安装

```js
npm install -g wecos
```

## 基本配置

配置文件：如小程序目录为`app`，在与app目录同级下创建`wecos.config.json`文件。

`wecos.config.json`配置项例子：
```json
{
  "appDir": "./app",
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
|:-- |:-- |:-- |
| appDir | **[String]** | 默认 `./app`，小程序项目目录 |
| cos | **[Object]** | 必填，填写需要上传到COS对应的配置信息，部分信息可在[COS控制台](https://console.qcloud.com/cos4/secret)查看 |

---

## 高级配置

| 配置项 | 类型 | 说明 |
|:-- |:-- |:-- |
| backupDir | **[String]** | 默认 `./wecos_backup`，备份目录 |
| uploadFileSuffix | **[Array]** | 默认 `[".jpg", ".png", ".gif"]`，需要处理的图片的后缀名 |
| uploadFileBlackList | **[Array]** | 默认 `[]`，指定不进行匹配的图片资源目录或具体图片的路径 |
| compress | **[Boolean]** | 默认 `false`，是否开启压缩图片，如果开启，需要先在万象优图控制台创建 COS 同名 Bucket（万象优图创建Bucket有一定延时，需等待 Bucket 生效） |
| watch | **[Boolean]** | 默认 `true`，是否开启实时监听文件变化 |

#### 设置备份目录

WeCOS提供了文件备份功能，避免误删除需要的文件，支持指定文件夹
```json
  "backupDir": "./wecos_backup"
```

#### 设置图片后缀

WeCOS提供了指定处理资源的后缀名功能，未指定的后缀类型不会被处理
```json
  "uploadFileSuffix": [".jpg",".png",".gif"]
```

#### 设置图片黑名单

WeCOS提供了指定不处理的资源黑名单功能，支持目录或具体路径
```json
  "uploadFileBlackList": ["./images/logo.png"]
```

#### 开启图片压缩

WeCOS提供了基于万象优图的图片压缩功能，资源将被压缩后上传（注：需在[万象优图控制台](https://console.qcloud.com/ci)创建 COS同名bucket）
```json
  "compress": true
```

#### 开启实时监听

WeCOS默认实时监听项目目录变化，自动处理资源，如果只需要一次性处理，可以修改该配置
```json
  "watch": false
```

## 使用

WeCOS提供了两种调用方式

* 在配置文件同级目录下命令行执行 `wecos`，需要该目录下有`wecos.config.json`文件

* node 模块调用，手动传入配置项
```js
var wecos = require('wecos');

/**
* option 可选 [String|Object]
* 传入 String，指定配置文件路径
* 传入 Object，指定配置项
*/
wecos([option]);
```