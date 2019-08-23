const { expect } = require('chai')
const chalk = require('chalk')
const request = require('request')

/* 16G mac sierra 10.13 下测定小于2s
 * 传入的linkArray
 * */
async function parseBaiduRedirect(linkArray){
  expect(linkArray[0]).to.have.property('link').and.not.have.property('url')
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

    item.url = parseRedirect(item.link, item.title)
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
function parseRedirect(link, title){
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
      console.log(chalk.red(e),chalk.red('链接预解析失败，将返回百度跳转链接'), title)
      resolve( link  )
    })
  })
}

module.exports = {
  parseBaiduRedirect,
  parseRedirect
}
