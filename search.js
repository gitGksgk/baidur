#! /usr/bin/env node

const chalk = require('chalk')

const commander = require('commander');
const program = new commander.Command();

const repl = require('repl')
const osHome = require('os').homedir()
const fs = require('fs-extra')

const {textByteLength, textColoredIgnorePart, keywordColor, combineResultToPrint} = require('./util.js')
const {isSequence, verifyIndiceAndCopy, verifyIndiceAndOpen} = require('./replRelated.js')

const {dateNowString, historyInitStamp} = require('./historyRelated.js')
const {contextWithNextSearchClass} = require('./preloadNextSearch.js')
const {baiduFilter} = require('./fetchData.js')

// 取消 possible memory leak
const EventEmitter = require('events');
const emitter = new EventEmitter();
emitter.setMaxListeners(200)


/* baiduShell.context 对象
 *{
   resultQueue:[
     nextSearch,
     nextSearch,
     ...
   ],
   resultQueueStatus: {
     ready: false,
     modifiable: false,
   }
   currentSearch:{
    resultArray,
    filteredArray,
    searchTime,
    keyword,
    errorLogArray, 
    page
   }
   nextSearch:{ 
     resultArray,
     filteredArray,
     searchTime,
     keyword,
     errorLogArray,
     page,
     nextReady: true
   }
   viewMode:{
      enableQueueNextSearch: true,   // 预加载队列，在快速切换时会加速，同时可启用filter，但不稳定。
      urlExpansion: false, // 结果标题下显示url
      useFilter: false,   // 开启过滤自定义站点
      saveHistory: false, // 保存搜索历史
      showReverse: true, // 搜索结果反向显示
      parseTimeout: 1000, // 重定向解析超时时间, 设为100 将会不解析大多数链接。
      consoleMode: {
        showFilter,
        showTime,
        showCurrentWord,
        showParseError,
      }
   }
   historyConfig: {
      historySize,
      searchTextOnly,
      compress,
   }
 }
 */

// 这个全局变量仅用于translator中调displayPrompt函数、全局 saveContext 使用
let baiduShell

let shellContext = new contextWithNextSearchClass({a:'why'})

let saveContext = (object) => shellContext.saveContext(object)
let preloadNext = (context, page, reconstructFlag) => shellContext.preloadNext(context,page,reconstructFlag)
let getNextArray = (pendingNextSearch) => shellContext.getNextArray(pendingNextSearch)
// let {preloadNext, saveContext, getNextArray} = shellContext

const homedir = osHome + '/.baidur'
const configPath = homedir + '/config'
fs.ensureDirSync(homedir)

program
.version('0.0.1')
.arguments('[searchText...]')
.action(async (searchText) => {
  searchText = searchText.join(' ')

  let defaultViewMode = {
    urlExpansion: false, //ok
    useFilter: false,
    saveHistory: true, //ok
    showReverse: true, //ok
    enableQueueNextSearch: true, //ok 
    parseTimeout: 1000, //ok
    consoleMode: {
      showFilter: true,
      showTime: true,
      showCurrentWord: true,
      showParseError: false,
    }
  }
  let defaultHistoryConfig = {
    historySize : 200, //ok
    searchTextOnly: true,
    compress:true
  }

  if( fs.pathExistsSync(configPath ) ){
    defaultViewMode = fs.readJsonSync(configPath).viewMode
    defaultHistoryConfig = fs.readJsonSync(configPath).historyConfig
  } else {
    saveConfig({
      viewMode: defaultViewMode,
      historyConfig: defaultHistoryConfig
    })
    let configHelpPath = configPath + '_help'
    fs.outputFileSync(configHelpPath, `
      viewMode:{
        enableQueueNextSearch: true,   // 预加载队列，在快速切换时会加速，同时可启用filter，但不稳定。
        urlExpansion: false, // 结果标题下显示url
        useFilter: false,   // 开启过滤自定义站点 功能暂未实现
        saveHistory: false, // 保存搜索历史
        showReverse: true, // 搜索结果反向显示
        parseTimeout: 1000, // 重定向解析超时时间, 设为100 将会不解析大多数链接。
        consoleMode: {
          showFilter, // 显示被过滤的站点标题
          showTime, // 显示搜索时间
          showCurrentWord, // 显示当前搜索词
          showParseError, // 显示重定向解析失败的条目
        }
      }
      historyConfig: {
        historySize,  // 保存历史的条数
        searchTextOnly, // 历史只保存搜索词，功能暂未实现
        compress, // 不删除，只在达到上限后压缩历史，功能暂未实现
      }
      `)

  }

  let currentSearch = await baiduFilter(searchText, 1, defaultViewMode.parseTimeout)
  resultPrint(currentSearch, defaultViewMode)

  baiduShell = repl.start({prompt:chalk.black(chalk.bgWhite('baidu搜索(输入h并回车显示帮助)')) + ' ', eval: translator})
  saveContext(baiduShell.context)
  baiduShell.context = shellContext
  saveContext({
    currentSearch,
    viewMode: defaultViewMode,
    historyConfig: defaultHistoryConfig,

    resultQueue: [],
    resultQueueStatus: {
      ready: false,
      modifiable: true
    },
  })

  // saveQueueStatus({modifiable:false})
  // console.log('init?',baiduShell.context.resultQueueStatus)

  getNextArray(baiduFilter(searchText, 2, defaultViewMode.parseTimeout))
  preloadNext(shellContext.context, 2, true)

  if( shellContext.context.viewMode.saveHistory ) {
    let historyFile = homedir + '/baidu_history'

    let historyInitialString = searchText + '\n-- ' + dateNowString() + '\n'
    historyInitStamp(historyFile, historyInitialString)

    baiduShell.historySize = defaultHistoryConfig.historySize
    baiduShell.setupHistory(historyFile, (err,repl) => {if(err) console.log(chalk.red(err))})
  }


})
program.parse(process.argv)

function saveConfig (object) {
  fs.outputJsonSync(configPath, {
    viewMode: object.viewMode,
    historyConfig: object.historyConfig
  },{spaces:'  '})
}

async function changePage(context, page){
  let {currentSearch, nextSearch , viewMode, resultQueue} = context;
  let {keyword:currentWord, page: currentPage} = currentSearch;
  let {nextReady, keyword: nextWord,  page: nextPage} = nextSearch

  let reconstructFlag = true
  if(page === currentPage){
    console.log(`已经是第${page}页`)
    return
  }
  if(page < 1 ){
    console.log(`已经是第1页`)
    return
  }
  if(nextReady && page === nextPage && currentWord === nextWord){
   //history console.log('using previous')
    currentSearch = nextSearch
    reconstructFlag = false
  }else{
   //history console.log('fetching new')
   //history console.log('changePage', nextReady , page ,nextPage, currentWord, nextWord)
   currentSearch = await baiduFilter(currentWord, page, context.viewMode.parseTimeout);
  }

  resultPrint(currentSearch, viewMode)
  console.log(`第${page}页`)
  saveContext({ currentSearch })

  //queue console.log('flagToPass',reconstructFlag)
  preloadNext(context, page, reconstructFlag)
}

// 这里的改变要更新到帮助文档
async function translator( cmd, shellcontext, filename, callback ){
  // console.log(1,cmd,2, context,3, filename,4, callback)
  // console.log('context',context)
  
  let {context} = shellContext // context 类要求
  if (cmd.slice(0,2) === 'c ' && isSequence(cmd.slice(2)) ){
    verifyIndiceAndCopy(cmd.slice(2), context.currentSearch.resultArray)
  }
  // 直接打开结果
  else if(cmd.slice(0,2) === 'o '){
    // console.log('context',context)
    cmd.slice(2).trim().split(' ').map(item => {
      verifyIndiceAndOpen(item, context.currentSearch.resultArray)
    });
  } else if(isSequence(cmd)){
      verifyIndiceAndOpen( cmd, context.currentSearch.resultArray)
  } else if(cmd.split(' ').every(item => isSequence(item))){
      cmd.split(' ').map( item => {
        verifyIndiceAndOpen(item, context.currentSearch.resultArray)
      })
  } else {
  // 其余特殊命令解释
    switch(cmd.trim()){
      case 'q': process.exit(); break;
      case 'n': {
        await changePage(context, context.currentSearch.page + 1 )
        break;
      }
      case 'b':{
        await changePage(context, context.currentSearch.page - 1 )
        break;
      }
      case 'f':{
        await changePage(context, 1 )
        break;
      }
      case 'x': context.viewMode.urlExpansion = !context.viewMode.urlExpansion; console.log('切换显示url模式'); break;
      case 'r': context.viewMode.showReverse = !context.viewMode.showReverse;  console.log('切换反向显示');break;
      case 's':{
        saveConfig({
          viewMode: context.viewMode,
          historyConfig: context.historyConfig
        })
        console.log('保存配置成功')
        break;
      }
      case '?': displayHelp(); break;
      case 'h': displayHelp(); break;
      default: {
        if(!cmd.trim()) break;
        const currentSearch = await baiduFilter(cmd, 1, context.viewMode.parseTimeout)
        getNextArray(baiduFilter(cmd, 2, context.viewMode.parseTimeout))

        preloadNext(context, 2)

        resultPrint( currentSearch, context.viewMode)
          
        saveContext({ currentSearch })
      }
    }
  }
  // context中无法获取这个函数.. 还得注册全局变量,破坏封装性
  baiduShell.displayPrompt()
}

function displayHelp(){
console.log(`
          解释器对特定输入的解释(均需回车生效):
          n, b, f               n - next 下一页; b - back 上一页; f - first 第一页
          index                 将会在浏览器中打开页面。index表示搜索结果前的序号
          range                 如输入1 4 6， 将同时打开序号为1 4 6的 3个页面。
                                range 是以空格分隔的一串数字； 
          o [index|range ...]   与直接输入数字效果相同，都将打开页面。用于兼容习惯 (o - open)
          c index               复制结果链接, c - copy
          q, ^D                 退出 q - quit
          x                     切换显示，切换在标题下显示url与否。x - url expansion,
          r                     切换反向显示 r - reverse
          w                     保存当前配置(x,r等控制的显示配置保存)。w - write
          ?, h                  显示帮助 h - help
          .help                 显示node.repl默认帮助
          *                     其他输入将解释为搜索词

      
      `)
}

function resultPrint(object, viewMode){
   // 76 是百度搜索限制字节长，汉字算2个字符
   let {resultArray, filteredArray, searchTime, keyword, errorLogArray} = object

   let {consoleMode} = viewMode
     console.log(viewMode)
   if(errorLogArray.length >= 1 && consoleMode.showParseError) {
     errorLogArray.map(item => {
       console.log(item)
     })
   }
   if(filteredArray.length >= 1 && consoleMode.showFilter){
     console.log('过滤了：')
     filteredArray.map(item => {
       console.log(item.title)
     })
   }

   if( textByteLength(keyword) > 76 ) {
     console.log('百度限制搜索词长度限制在38个汉字以内, 红色部分将被忽略')
     console.log(textColoredIgnorePart(keyword, 76))
   }

   if(resultArray.length > 1)
   combineResultToPrint(resultArray, keyword, viewMode).forEach(item => {
     console.log(item)
   }) 

   if(consoleMode.showTime)
   console.log(`搜索用时: ${searchTime/1000}秒`)

   if(consoleMode.showCurrentWord)
   console.log(`当前搜索：${keyword}`)
}

