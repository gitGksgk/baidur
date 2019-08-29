const baidu = require('baidu-search')
const {parseBaiduRedirect} = require('./parseRedirect.js')

async function baiduFilter(keyword, page, timewait){
  /* 基础策略：把description空的放行
   * 为了提速，如果贪心策略，搞乱分页，需要保存进全局破坏封装性且拖慢首屏速度
   * 现在决定第一页直接过滤无description的，后面保持
   * */
   let resultArray = [] 
   let filteredArray = []

   let timeStart = new Date()

   // console.log('filterPage',page)
   let tempArray = await promisifyBaidu( keyword, page)
   tempArray.map(item => {
     if( item.description !== '' ){
       resultArray.push( item )
     }else{
       filteredArray.push(item)
     }
   })

   // 重定向解析限时 1s; 网络良好时至少在200ms
   let timeout = timewait ||  1000
   
   let errorLogArray = []
   if(resultArray.length < 1)
      errorLogArray.push(chalk.red('什么都没找到'))
   else {
      errorLogArray = await parseBaiduRedirect( resultArray , timeout )
   }
   let searchTime = new Date() - timeStart

   return Promise.resolve( {resultArray, filteredArray, searchTime, keyword, errorLogArray, page} )
}

function promisifyBaidu(keyword, page){
  return new Promise( (resolve, reject) => {
    baidu( keyword , page ,( (err,res)=>{
      resolve( res.links )
    }))
  })
}

module.exports = {
  baiduFilter
}
