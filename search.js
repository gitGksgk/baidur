var baidu = require('baidu-search')
var chalk = require('chalk')
var request = require('request')
const async = require('async')

const commander = require('commander');
const program = new commander.Command();

program
.version('0.0.1')
.action((cmd, env) => {
  console.log(cmd)
  baiduWrapper(cmd, 1)
})
console.log()
program.parse(process.argv)

function baiduWrapper(keyword, page){
  console.time('搜索用时')
  baidu( keyword , page ,( (err,res)=>{
    // console.log(err)
      console.time('重定向解析用时')
       parseBaiduRedirect(res.links).then(res => {
         
        console.timeEnd('重定向解析用时')
         combineResultToPrint(res,keyword).forEach(item => {
           // item = keywordColor(item, keyword)
           // infoArray.push( `${chalk.cyan(index + 1)}.  ${chalk.green(linkArray[index].title)}\n    ${chalk.yellow(item.url)}\n    ${linkArray[index].description}\n`)

           console.log((item))
         }) 

         console.log(`当前搜索：${keyword}`)
       })
       
  }))
  console.timeEnd('搜索用时')
}

function combineResultToPrint(linkArray, keyword){
  let infoArray = [] 
  return linkArray.map( (item, index) => {
    return `${chalk.cyan(index + 1)}.  ${chalk.green(item.title)}\n    ${chalk.yellow(item.url)}\n    ${keywordColor(item.description,keyword)}\n`
  }).reverse()
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

/* 16G mac sierra 10.13 下测定小于2s
 * */
async function parseBaiduRedirect(linkArray){
  let promises = linkArray.map( ( item, index ) => {
    /* '/sf/vsearch?pd=video&tn=vsearch&lid=8af3269300013a7a&ie=utf-8&rsv_pq=8af3269300013a7a&wd=haha&rsv_spt=5&rsv_t=8bff6RsCPsEeitNsu%2FzNFfMXrdFBc2FBAuxS4x7Hnsofk%2FnoLwKOUVDOgYI&rsv_bp=1&f=8'
    * 百度视频搜索链接,与跳转链接www.baidu.com/link?url=***不同，不带domain name.在if中将其统一化
    */
    let domain =  'http://www.baidu.com'
    if( item.link.slice(0,1) === '/')
      item.link = domain + item.link

    /* 如果开头不是 http://www.baidu.com/link?url= ，则直接返回而不发送head请求而直接返回
     * */

    let redirectUrl = domain + '/link?url='
    if( item.link.slice(0, redirectUrl.length) !== redirectUrl){
      return Promise.resolve( item.link )
    }

    item.url = parseRedirect(item.link)
    return Promise.resolve(item.url)
  })
  await Promise.all( promises )
          .then(res => {
            linkArray.forEach( (item,index) => {
              item.url = res[index]
            })
          })
          .catch( error => {
            console.log(chalk.red(error))
          })

  return linkArray
}
function parseRedirect(link){
  return new Promise( (resolve,reject) => {
    request
    /* 重定向解析限时1s, 过滤不支持HEAD方法、响应慢的网站
     * */
    .head(link, {timeout:1000})
    .on('response', resp =>{
      resolve( resp.request.uri.href )
    })
    .on('error', e => {
      // 解析失败如果reject，将导致其他正常解析的也无法显示，故原链返回
      console.log(chalk.red(e),'将返回百度跳转链接', link)
      resolve( link  )
    })
  })
}

