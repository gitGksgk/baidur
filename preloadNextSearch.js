const {baiduFilter} = require('./fetchData.js')
const chalk = require('chalk')
//baiduShell -> this
class contextWithNextSearchClass{
  constructor(context){
    this.context = context
  }

  getNextArray(pendingNextSearch){
    this.saveContext({
      nextSearch:{
        nextReady:false
      }
    })
    return new Promise( (resolve,reject) => {
      pendingNextSearch.then( res => {
        let {resultArray, filteredArray, searchTime, keyword, errorLogArray, page} = res
        let saveObject = {
          resultArray,
          filteredArray,
          searchTime,
          keyword,
          errorLogArray,
          page,
          nextReady: true,
        }
        this.saveContext({
          nextSearch: saveObject
        })
        // console.dir(baiduShell.context.nextSearch, {depth:1})
        resolve(saveObject)
      })
      .catch(e => {
        // 只发现了翻页过快出过错，暂时忽略
      })
    })
  }

  saveQueueStatus(object){
    let {resultQueueStatus} = this.context 
    this.saveContext({
      resultQueueStatus:{
        ...resultQueueStatus,
        ...object
      }
    })
  }

  clearQueueNextSearch(){
    this.saveQueueStatus({
      ready:false,
      modifiable:true
    })
    this.saveContext({resultQueue:[]})
  }

  autofillQueueNextSearch(){
    // 3: queueLimit
    // console.log('autofillQueueNextSearch:start')
    // console.log('currentQueue')
    // console.dir(this.context.resultQueue,{depth:1})
    let {page, keyword} = this.context.currentSearch
    let queueLastPage = page + 1
    let {resultQueue, resultQueueStatus:{modifiable}} = this.context
     // console.dir(resultQueue,{depth:1})
    this.saveQueueStatus({ready:false})


    if( ! modifiable ) return
    //if( resultQueue.length > 0 ){
      if(resultQueue.length > 0)
      queueLastPage = resultQueue[ resultQueue.length - 1 ].page

      // console.log('pagediff:',queueLastPage + 1 - page)
      // 当前搜索往后三页
      if (queueLastPage + 1 - page <= 3){
        // enqueueNextSearch( getNextArray(baiduFilter(keyword, page + 1 )) )
        // 暂时用异步写法，保证queue里面的数据都非pending
        baiduFilter(keyword, queueLastPage + 1).then(res => {
          this.enqueueNextSearch({ ...res, nextReady: true })
          this.autofillQueueNextSearch()
        })
      } else {
        // 结束递归
        // console.log('endQueue')
        // console.dir(resultQueue,{depth:1})
        this.saveQueueStatus({ready:true})
        // console.log('autofillQueueNextSearch:done')
        // console.log(this.context.resultQueueStatus)
      }
    //} else {
      // queue 里无数据，认为是初始化，把已取得的数据装入
      // console.log('enqueueNextSearch')
      // enqueueNextSearch(nextSearch)
     // autofillQueueNextSearch()
    //}
  }


  enqueueNextSearch(object){
    // object 结构需与 nextSearch 相同
    let {context:{resultQueue}} = this
    this.saveContext({
      resultQueue: [...resultQueue, object]
    })
  }

  dequeueNextSearch(){
    let {context, context:{resultQueue}} = this
    let object = resultQueue.shift()
    this.saveContext({resultQueue})
    return object
  }

  saveContext(object){
    this.context = {
      ...this.context,
      ...object
    }
  }


  // 惯性加载场景少，暂时总是加载下一页
  async preloadNext(context, page, reconstructQueueOrNot) {
    //queue console.log('preloadNext', page)
    let {keyword} = context.currentSearch
    let { resultQueue, resultQueueStatus:{ready:resultQueueReady} } = context
    //queue console.log(context.resultQueueStatus)
    //queue console.log(resultQueue[0])

    // 只要队列有合适的数据，就读入nextSearch。如果队列未完成，则重建队列, 如果未从队列读取，说明队列有问题，需要重建队列；如果未从nextSearch中读取，说明队列有问题,需要重建。
    
    let reconstructFlag
    if(typeof reconstructQueueOrNot === 'boolean')
    reconstructFlag = reconstructQueueOrNot
    else
    reconstructFlag = true

    //queue console.log('flag',reconstructFlag, reconstructQueueOrNot)
    if( resultQueue[0] && resultQueue[0].nextReady && resultQueue[0].keyword === keyword ){

      //queue console.log('readFromQueueInternal: before')
      //queue console.dir(this.context.resultQueue,{depth:1})
      let error = await this.getNextArray(Promise.resolve(this.dequeueNextSearch()))
      //queue console.log('readFromQueueInternal: after')
      //queue console.dir(this.context.resultQueue,{depth:1})

      reconstructFlag = false 
    } else {
      //queue console.log(chalk.red('未从队列读取'))
      //queue console.log( resultQueue[0] )
      //queue if(resultQueue[0]){
      //queue   console.log( resultQueue[0].keyword, resultQueue[0].nextReady )
      //queue }
      // 未读取，则重新请求下一页
      this.getNextArray(baiduFilter(keyword, page + 1 ))
    }
    
    if(context.viewMode.enableQueueNextSearch){
      if (resultQueueReady && !reconstructFlag){
        //queue console.log('filling queue')
         this.autofillQueueNextSearch()
      } else{
         //queue console.log('reconstruct queue')
         this.reconstructQueueNextSearch(keyword, page)
      }
    }
  }

  async reconstructQueueNextSearch(keyword, page){
      // 写入锁
      this.saveQueueStatus({modifiable:false})
      await this.getNextArray(baiduFilter(keyword, page + 1 ));
      // console.log(baiduShell.context.nextSearch.page, '-----')
      this.saveQueueStatus({modifiable:true})
      this.clearQueueNextSearch()
      this.autofillQueueNextSearch()
  }
}

module.exports = {
  contextWithNextSearchClass,
}
