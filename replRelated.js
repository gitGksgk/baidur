const { expect } = require('chai')
const chalk = require('chalk')
const clipboardy = require('clipboardy');
const open = require('open')

/* 对结果的url进行操作 */
function assertItemArrayIsUrl(itemArray){
  expect(itemArray[0]).to.has.property('url')
  expect(itemArray[0].url.slice(0,4)).to.include('http')
  expect(itemArray[0].url.slice(4,8)).to.include('://')
}

function isSequence(str){
  // 若支持自定义结果数，则10应变为自定义值
  str = str.trim()
  if(!isNaN(parseInt(str)) && !isNaN(str) && Number(str) <= 10 ){
    return true
  }
  return false
}

function verifyIndiceAndOperateUrl(index, itemArray, callback){
  // 这个函数有一定风险, 要注意
  assertItemArrayIsUrl(itemArray)
  if( Number(index) - 1 >= itemArray.length)
    console.log(chalk.red(`没有序号为${Number(index)}的条目`))
  else
    callback(itemArray[Number(index) - 1].url)
}
function verifyIndiceAndOpen(index, itemArray){
  verifyIndiceAndOperateUrl(index, itemArray, open)
}
function verifyIndiceAndCopy(index, itemArray){
   verifyIndiceAndOperateUrl(index, itemArray, (url) => {
     clipboardy.writeSync(url)
     console.log(`复制了${url}`)
   })
}

module.exports = {
  isSequence,
  verifyIndiceAndOperateUrl,
  verifyIndiceAndOpen,
  verifyIndiceAndCopy
}
