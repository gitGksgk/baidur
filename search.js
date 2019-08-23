const baidu = require('baidu-search')
const chalk = require('chalk')
const async = require('async')

const commander = require('commander');
const program = new commander.Command();
const open = require('open')

const repl = require('repl')
const fs = require('fs')

const clipboardy = require('clipboardy');

console.log(require('./util'))

const {keywordByteLength, keywordIgnore} = require('./util.js')
const {parseBaiduRedirect} = require('./parseRedirect.js')

// 76 是百度搜索限制字节长，汉字算2个字符

/* baiduShell.context 对象
 *{
   keyword      String
   currentPage  int
   lastSearch  Array
   viewMode:{
      urlExpansion: false, // 结果标题下显示url
      useFilter: false,   // 开启过滤自定义站点
      saveHistory: false, // 保存搜索历史
      showReverse: true, // 搜索结果反向显示
      consoleMode: {
        showFilter,
        showTime,
        showCurrentWord,
        showParseError,
      }
   }
   defaultHistoryConfig: {
      historySize,
      searchTextOnly,
      compress,
   }
 }
 */

// 这个全局变量仅用于translator中调displayPrompt 函数
var baiduShell

program
.version('0.0.1')
.arguments('[searchText...]')
.action(async (searchText) => {
  searchText = searchText.join(' ')
  let defaultViewMode = {
    urlExpansion: false, //ok
    useFilter: false,
    saveHistory: true,
    showReverse: true, //ok
    consoleMode: {
      showFilter: true,
      showTime: true,
      showCurrentWord: true,
      showParseError: true,
    }
  }
  let defaultHistoryConfig = {
    historySize : 200, //ok
    searchTextOnly: true,
    compress:true
  }

  let lastSearch = await baiduFilter(searchText, 1, defaultViewMode)

  baiduShell = repl.start({prompt:chalk.black(chalk.bgWhite('baidu搜索(输入? 回车显示帮助)')) + ' ', eval: translator})
  baiduShell.context.lastSearch = lastSearch
  baiduShell.context.currentPage = 1
  baiduShell.context.keyword = searchText.trim()
  baiduShell.context.viewMode = defaultViewMode

  baiduShell.historySize = defaultHistoryConfig.historySize

  if( baiduShell.context.viewMode.saveHistory ){
    let historyFile = require('os').homedir() + '/.baidu_history'

    let historyInitialString = searchText + '\n-- ' + dateNowString() + '\n'
    historyInit(historyFile, historyInitialString)
  
    // fs.writeSync(historyFile, historyInitialString, {flag:'a'}) // 确保有这个文件
    baiduShell.setupHistory(historyFile, (err,repl) => {if(err) console.log(chalk.red(err))})
  }


})
program.parse(process.argv)

function dateNowString(){
  let date = new Date()
  return dateFormat("YYYY-mm-dd HH:MM:SS", date)
}
function dateFormat(fmt, date) {
    let ret;
    let opt = {
        "Y+": date.getFullYear().toString(),        // 年
        "m+": (date.getMonth() + 1).toString(),     // 月
        "d+": date.getDate().toString(),            // 日
        "H+": date.getHours().toString(),           // 时
        "M+": date.getMinutes().toString(),         // 分
        "S+": date.getSeconds().toString()          // 秒
        // 有其他格式化字符需求可以继续添加，必须转化成字符串
    };
    for (let k in opt) {
        ret = new RegExp("(" + k + ")").exec(fmt);
        if (ret) {
            fmt = fmt.replace(ret[1], (ret[1].length == 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, "0")))
        };
    };
    return fmt;
}

// 目前只能用全部读入再写的方法; 测得400w条时300ms
function historyInit(filePath, initString) {
    // mode 0o0600 copy from nodejs/internal/repl/history.js
    try{
      let currentHistory = fs.readFileSync(filePath , 'utf8')
      let hnd = fs.openSync(filePath , 'w+', 0o0600 );
      fs.writeFileSync(hnd,  initString + currentHistory , 'utf8');
      fs.closeSync(hnd);
    }
    catch (err) {
      // Cannot open history file.
      // Don't crash, just don't persist history.
      console.log('\nError: Could not open history file.\n' +
        'REPL session history will not be persisted.\n');
      console.log(err.stack);
    }
}
// 这里的改变要更新到帮助文档
async function translator( cmd, context, filename, callback ){
  // console.log(1,cmd,2, context,3, filename,4, callback)
  // console.log('context',context)
  
  if (cmd.slice(0,2) === 'c ' && isSequence(cmd.slice(2)) ){
    verifyIndiceAndCopy(cmd.slice(2), context.lastSearch)
  }
  // 直接打开结果
  else if(cmd.slice(0,2) === 'o '){
    // console.log('context',context)
    cmd.slice(2).trim().split(' ').map(item => {
      verifyIndiceAndOpen(item, context.lastSearch)
    });
  } else if(isSequence(cmd)){
      verifyIndiceAndOpen( cmd, context.lastSearch)
  } else if(cmd.split(' ').every(item => isSequence(item))){
      cmd.split(' ').map( item => {
        verifyIndiceAndOpen(item, context.lastSearch)
      })
  } else {
  // 其余特殊命令解释
    switch(cmd.trim()){
      case 'q': process.exit(); break;
      case 'n': {
        let { keyword, currentPage } = context;
        const lastSearch = await baiduWrapper(keyword, currentPage + 1, context.viewMode);
        console.log(`第${currentPage + 1}页`)
        context.currentPage += 1 ;
        context.lastSearch = lastSearch ;
        break;
      }
      case 'b':{
        let { keyword, currentPage } = context;
        if (currentPage === 1){
          console.log('已经是第一页')
        }else{
          const lastSearch = await baiduWrapper(keyword, currentPage - 1, context.viewMode);
          console.log(`第${currentPage - 1}页`)
          context.currentPage = currentPage - 1 ;
          context.lastSearch = lastSearch ;
        }
        break;
      }
      case 'f':{
        let { keyword, currentPage } = context;
        if (currentPage === 1){
          console.log('已经是第一页')
        } else {
          const lastSearch = await baiduWrapper(keyword, 1, context.viewMode);
          context.currentPage = 1;
          context.lastSearch = lastSearch ;
        }
        break;
      }
      case 'x': context.viewMode.urlExpansion = !context.viewMode.urlExpansion; console.log('切换显示url模式'); break;
      case 'r': context.viewMode.showReverse = !context.viewMode.showReverse;  console.log('切换反向显示');break;
      case 's': console.log('functionality not accomplished'); break;
      case '?': displayHelp(); break;
      case 'h': displayHelp(); break;
      default: {
        const lastSearch = await baiduFilter(cmd, 1, context.viewMode)
        context.keyword = cmd.trim(); 
        context.lastSearch = lastSearch ;
      }
    }
  }
  //console.log(chalk.bgWhite("baidu搜索:" ))
  // context中居然无法获取这个函数怎么办.. 还得注册全局变量破坏封装性
  baiduShell.displayPrompt()
}
function isSequence(str){
  if( !isNaN(str) && Number(str) <= 10 ){
    return true
  }
  return false
}
function verifyIndiceAndOpen(index, itemArray){
  if( Number(index) - 1 >= itemArray.length)
    console.log(chalk.red(`没有序号为${Number(index)}的条目`))
  else
    open(itemArray[Number(index) - 1].url )
}
function verifyIndiceAndCopy(index, itemArray){
  if( Number(index) - 1 >= itemArray.length)
    console.log(chalk.red(`没有序号为${Number(index)}的条目`))
  else{
    let copyUrl = itemArray[index - 1].url
    clipboardy.writeSync(copyUrl)
    console.log(`复制了${copyUrl}`)
  }
}

function displayHelp(){
console.log(`
          解释器对特定输入的解释(均需回车生效):
          n, b, f               n - next 下一页; b - back 上一页; f - first 第一页
          index                 将会在浏览器中打开页面。index表示搜索结果前的序号
          range                 如输入1 4 6， 将同时打开序号为1 4 6的 3个页面。
                                range 是以空格分隔的一串数字； 
          o [index|range ...]   与直接输入数字效果相同，都将打开页面。用于兼容习惯 (o - open)
          x                     切换显示，切换在标题下显示url与否。x - url expansion,
          r                     切换反向显示 r - reverse
          c index               复制结果链接, c - copy
          q, ^D                 退出 q - quit
          ?, h                  显示帮助 h - help
          .help                 显示node.repl默认帮助
          *                     其他输入将解释为搜索词

      
      `)
}

async function baiduFilter(keyword, page, viewMode){
  /* 基础策略：把description空的放行
   * 为了提速，如果贪心策略，搞乱分页，需要保存进全局破坏封装性且拖慢首屏速度
   * 现在决定第一页直接过滤无description的，后面保持
   * */
   let resultArray = [] 
   let filteredArray = []

   console.time('搜索用时')
   if( keywordByteLength(keyword) > 76 ) {
     console.log('百度限制搜索词长度限制在38个汉字以内, 红色部分将被忽略')
     console.log(keywordIgnore(keyword))
   }

   let tempArray = await simpleBaiduWrapper( keyword, page)
   tempArray.map(item => {
     if( item.description !== '' ){
       resultArray.push( item )
     }else{
       filteredArray.push(item)
     }
   })

   console.log('过滤了：')
   filteredArray.map(item => {
     console.log(item.title)
   })

   await parseBaiduRedirect( resultArray, keyword).then(res => {
     combineResultToPrint(resultArray , keyword, viewMode).forEach(item => {
       console.log((item))
     }) 
   })
   console.timeEnd('搜索用时')
   console.log(`当前搜索：${keyword}`)

   // console.log(resultArray)
   return Promise.resolve( resultArray )
}

function simpleBaiduWrapper(keyword, page){
  return new Promise( (resolve, reject) => {
    baidu( keyword , page ,( (err,res)=>{
      resolve( res.links )
    }))
  })
}


function baiduWrapper(keyword, page, viewMode){
  return new Promise( (resolve, reject) => {
    baidu( keyword , page ,( (err,res)=>{
      // console.log(err)
     console.time('重定向解析用时')
     parseBaiduRedirect(res.links).then(res => {
       console.timeEnd('重定向解析用时')
       combineResultToPrint(res, keyword, viewMode).forEach(item => {
         console.log((item))
       }) 

       console.log(`当前搜索：${keyword}`)
       resolve( res )
     })
    }))
  })
}

function combineResultToPrint(linkArray, keyword, viewMode){
  let infoArray = [] 
  let showingUrl = viewMode.urlExpansion || false
  let printArray = linkArray.map( (item, index) => {
    if (showingUrl)
    return `${chalk.cyan(index + 1)}.  ${chalk.green(item.title)}  ${chalk.yellow('[ ' + getDomain(item.url) + ' ]' ) } \n    ${chalk.yellow(item.url)}\n    ${keywordColor(item.description,keyword)}\n`
    else 
    return `${chalk.cyan(index + 1)}.  ${chalk.green(item.title)}  ${chalk.yellow('[ ' + getDomain(item.url) + ' ]' ) } \n    ${keywordColor(item.description,keyword)}\n`
  })
  if( viewMode.showReverse ){
    return printArray.reverse()
  } else {
    return printArray
  }
}
function getDomain(url){
  /* https:// 刚好8个字
   * */
  return url.slice(0,8 + url.slice(8).indexOf('/') )
}

function keywordColor(text, keyword){
  if(!text) return text
  //timer console.time()
  keyword = keyword.toLowerCase()

  let coloredText = ''
  let tempText = text

  let keywordIndex = tempText.toLowerCase().indexOf(keyword)
  // console.log('middle',keywordIndex)
  while(keywordIndex >= 0 && !!tempText){
    if(keywordIndex >= 0){
      let leftText = tempText.slice(0, keywordIndex)
      let colorKeyword = chalk.redBright(tempText.slice(keywordIndex, keywordIndex + keyword.length))
      let rightText = tempText.slice(keywordIndex + keyword.length)
      tempText = `${rightText}`
      coloredText += `${leftText}${colorKeyword}`
    }
    keywordIndex = tempText.toLowerCase().indexOf(keyword)
    // console.log(keywordIndex)
    if(keywordIndex > 200)
    throw('查找超过200字，疑似上色逻辑陷入死循环...')
  }
  coloredText += tempText
  // console.log('done')  //timer console.time()
  //timer console.log('上色时间测试', console.timeEnd())
  return coloredText
}
