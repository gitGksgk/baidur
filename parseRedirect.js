const { expect } = require('chai')
const chalk = require('chalk')
const request = require('request')

/* 16G mac sierra 10.13 下10条测定小于2s
 * 非纯函数，传入的linkArray将会被修改
 * 返回发生错误的值
 * */
async function parseBaiduRedirect(linkArray, timeout){
  expect(linkArray[0]).to.have.property('link').and.not.have.property('url')
  expect(linkArray[0].link).to.be.a('string')
  expect(linkArray[0].link.slice(0,4)).to.include('http')
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
      return Promise.resolve( {url:item.link, log:''} )
    }

    return Promise.resolve( parseRedirect(item.link, item.title, timeout) )
  })
  let logArray = []
  await Promise.all( promises )
          .then(res => {
            linkArray.forEach( (item,index) => {
              item.url = res[index].url
              if(!!res[index].log){logArray.push(`${res[index].log} ${chalk.red('链接预解析失败，将返回百度跳转链接')} ${item.title}`)}
            })
          })
          .catch( error => {
            logArray.push(chalk.red(error))
          })

  return logArray
}
function parseRedirect(link, title, timeout){
  return new Promise( (resolve,reject) => {
    request
    /* 重定向解析限时1s, 过滤不支持HEAD方法、响应慢的网站
     * */
    .head(link, {timeout})
    .on('response', resp =>{
      resolve( {url:resp.request.uri.href, log:''} )
    })
    .on('error', e => {
      // 解析失败如果reject，将导致其他正常解析的也无法显示，故原链返回
      resolve( {url:link, log:`${chalk.red(e)}`} )
    })
  })
}

module.exports = {
  parseBaiduRedirect,
  parseRedirect
}
