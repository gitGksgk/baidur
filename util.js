const { expect } = require('chai')
const chalk = require('chalk')

/* 目标 中文2字节 英文、标点1字节；实现：ascii外的都算2字节
 * UTF-8 使用一至四个字节为每个字符编码。128 个 ASCII 字符（Unicode 范围由 U+0000 至 U+007F）只需一个字节，带有变音符号的拉丁文、希腊文、西里尔字母、亚美尼亚语、希伯来文、阿拉伯文、叙利亚文及马尔代夫语（Unicode 范围由 U+0080 至 U+07FF）需要二个字节，其他基本多文种平面（BMP）中的字符（CJK属于此类-Qieqie注）使用三个字节，其他 Unicode 辅助平面的字符使用四字节编码。
 * 将utf-8的认知转为baidu的规则
 */
function textByteLength(str){
  try {
    let length = str.length
    for( let s of str){
      if( s.charCodeAt() >= 128 )
      // console.log(str)
      length ++ 
    }
    return length
  }
  catch(e){
    console.log(e)
  }
}

function textColoredIgnorePart(str, lengthLimit){
  try {
    let index = 0
    let length = 0
    for( let s of str){
      if( s.charCodeAt() >= 128 )
      // console.log(str)
      length += 2
      else
      length += 1

      if( length > lengthLimit){
        return str.slice(0, index) + chalk.red(str.slice(index))
      }
      index += 1
    }
    return str

  }
  catch(e){
    console.log(e)
  }
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


function combineResultToPrint(linkArray, keyword, viewMode){
  expect(linkArray[0]).to.have.property('title')
  expect(linkArray[0]).to.have.property('description')
  expect(linkArray[0]).to.have.property('url')
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
  expect(url.slice(0,4)).to.include('http')
  expect(url.slice(8)).to.include('/')
  return url.slice(0,8 + url.slice(8).indexOf('/') )
}


module.exports = {
  textByteLength,
  textColoredIgnorePart,
  keywordColor,
  combineResultToPrint,
}
