baidu 是一个命令行工具，从命令行百度。因为用惯了ddgr跟googler，找了一圈没有发现baidu的类似东西，毕竟前两个必须fq伤不起，于是决定写(chao)一个，同时改进一下现在的终端搜索的不爽之处

设定功能
o 快速、干净、自定义色彩
- 自定义结果页数// 定制条数与首屏速度矛盾，定制页数又不便于使用，最好自定义结果条数。这又与渲染时间矛盾，不知道要抓几条才能够数
                // 考虑使用途径，目前方案 首屏无描述的全过滤，不再抓取。此后不作过滤。
o 倒序 //或适应当前terminal
o 搜索语法支持 "-, site:, inurl:, filetype:,"
- 高级搜索 区域 时间
- 情景模式（配置文件过滤一些站点） // 过滤与速度矛盾
- 百度快照
o 底部搜索词
// - 上部相关搜索
- 百度贴吧、百度百科、百度图片、下载站支持 
o REPL 交互式解释器
o- vim 风格 + ddgr 风格 快捷键: q n b f o x c h ? r
o- 支持直接输入一系列索引
o- 支持反向显示切换
o-  搜索历史、格式化 // 由于setupHistory是头部添加，而试了fs.createWriteStream 跟 fs.write 头部添加均会覆盖数据，node v12.0 macOS10.13.6 原因不明，唯一方案是照库中做法，全部读入再写
o- historySize 配置
-- 历史压缩
-- 仅记录搜索词
-- 上下方向键查询历史, 字节支持 // 得自己动手 困难
o 关键词长度超限警告
o 搜索结果关键词高亮
o 跳转链的链接解析
- 收集总是解析失败的链接
- 命令帮助文档
o repl帮助文档
- 预加载下一页
- 拆分、测试
- 自检程序

# Usage 用法

搜索引擎自身支持的语法，例如
baidu 关键词
baidu 关键词 site:stackoverflow.com
baidu "关键词 -排除词"  // 如要使用 - 语法，引号是必要的。否则bash将认为是一个选项参数而导致错误

设置bash alias, 例如
alias bs="baidu $@ site:stackoverflow.com"
alias bn="baidu '关键词 -排除词1 -排除词2'" // 注意搜索引擎的词数限制


# Installation 安装

# Acknowledge 致谢

baidu-search
搜索引擎开发者前辈们、开放搜索的UGC社区创造者们

# Warning 注意
也许会挂，谨慎入坑
