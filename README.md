baidur 是一个命令行工具，从命令行获取百度结果。因为用惯了ddgr跟googler，找了一圈没有发现baidur的类似东西，毕竟前两个必须fq伤不起，于是决定写(chao)一个，同时改进一下现在的终端搜索的不爽之处

特色

- 免fq<br  />
- 浏览器内打开多标签是同步的<br  />

优点

- 预加载下一页, 速度快<br  />
- 同时打开多个结果标签<br  />

搭配使用

浏览器端

- Tab Manager 类插件（以便批量关闭）<br  />
- vimium （快速关闭）<br  />

# Usage 用法

搜索引擎自身支持的语法，例如
```
baidur 关键词
baidur 关键词 site:stackoverflow.com
baidur "关键词 -排除词"  
```

如要使用 - 语法，引号是必要的。否则bash将认为是一个选项参数而导致错误

设置bash alias, 例如
```
alias bs="baidur $@ site:stackoverflow.com"<br  />
alias bn="baidur '关键词 -排除词1 -排除词2'" // 注意搜索引擎的词数限制<br  />
```


# Installation 安装

安装 nodejs 生产环境。目前要求 >11.10.0， 一般附带了包管理工具npm，接着运行
```
npm install -g baidur

```
就好了

# Acknowledge 致谢

baidu-search

搜索引擎开发者前辈们、开放搜索的UGC社区创造者、广大博主们


# Warning 注意

也许会挂，谨慎入坑

百度默认转换中文逗号为英文逗号，可能导致搜索词超长时忽略字与百度忽略的字不精确相同。由于场景不多暂不考虑。

setupHistory 要求node版本11.10.0

还有很多有价值的中文网页由于各种原因未能被百度收录

# 开发进度
known issue
repl在不同终端上表现不同, 有的甚至不能接收中文

o: done  a: alpha - thoughts  // cancel & comment<br  />
显示
o- 快速、干净、自定义色彩<br  />
o- 关键词长度超限警告<br  />
o- 搜索结果关键词高亮<br  />
o- 跳转链的链接解析<br  />
-- 命令帮助文档<br  />
o- repl帮助文档<br  />
o- 预加载下一页<br  />
o- 倒序 //或适应当前terminal<br  />
o- 搜索语法支持 "-, site:, inurl:, filetype:,"<br  />
o- 底部搜索词<br  />

- 高级搜索 区域 时间<br  />
- 百度快照<br  />
// - 上部相关搜索
- 百度贴吧、百度百科、百度图片、下载站支持<br  />

REPL 交互式解释器
o- vim 风格 + ddgr 风格 快捷键: q n b f o x c h ? r<br  />
o- 支持直接输入一系列索引<br  />
o- 支持反向显示切换<br  />
o-  搜索历史、格式化 // 由于setupHistory是头部添加，而试了fs.createWriteStream 跟 fs.write 头部添加均会覆盖数据，node v12.0 macOS10.13.6 原因不明，唯一方案是照库中做法，全部读入再写<br  />
o- historySize 配置<br  />
o- 脱离setupHistory 以便降低node版本等级要求<br  />
-- 历史压缩<br  />
-- 仅记录搜索词<br  />
-- 上下方向键查询历史, 字节支持 // 得自己动手 困难<br  />
-- 默认config的写入<br  />
-- repl: save current config<br  />
-- repl: show current config<br  />
-- repl 加入filter<br  />

自定义结果页数// 需要拼接结果; 弄一个队列
                // 定制条数与首屏速度矛盾，定制页数又不便于使用，最好自定义结果条数。这又与渲染时间矛盾，不知道要抓几条才能够数
                // 考虑使用途径，目前方案 首屏无描述的全过滤，不再抓取。此后不作过滤。发现百度有pn参数
o- 队列 队列边界: next2search<br  />
-- 历史结果<br  />
-- 拼接搜索结果<br  />
-- 过滤 与过滤原因<br  />
-- 情景模式（配置文件过滤一些站点） // 过滤与速度矛盾<br  />
-- 收集总是解析失败的链接<br  />

a 拆分、测试<br  />
o- 数据处理与显示逻辑解耦<br  />
o- 模块解耦: 历史、repl、重定向解析、<br  />
a 自检程序<br  />

- 错误处理<br  />
o- 无结果<br  />


# License

GPL 3.0

# Contribute 贡献

欢迎想法、参与、需求、需求+1、改进
