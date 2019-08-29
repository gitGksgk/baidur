// const render = require('consolidate').handlebars.render
const { expect } = require('chai')
const fs = require('fs')
const path = require('path')

const chalk = require('chalk')
const log = console.log

const baiduFetch = require('baidu-search')
const util = require('./util.js')
const {parseRedirect, parseBaiduRedirect} = require('./parseRedirect.js')


describe('baidur',async () => {

  describe('网络模块', () => {
    it('baidu-search依赖包返回正确数据', async () => {
      let testKeyword = '横扫千军如卷席'
      let page = 2
      let res = await new Promise( (resolve, reject) => {
        baiduFetch(testKeyword, page, (err,res) => {
          console.log(Object.keys(res))
          // console.log( res.keyWord, res.beginPage, res.$, res.url, res.links)
          return resolve(res)
        })
      })
      expect(res.links).to.be.an('Array')
      expect(res.links[0]).to.be.an('Object')
      expect(res.links[0]).to.have.property('link')
      expect(res.links[0]).to.have.property('title')
      expect(res.links[0]).to.have.property('description')
      expect(res.keyWord).to.be.equal(testKeyword)
      expect(res.beginPage).to.be.equal(page)
      
    })
    it('使用HEAD请求解析baidu跳转链接的真实地址：正常工作', async () => {
      let redirectRes = await parseBaiduRedirect(res.links)
      console.log('====================',redirectRes)
    })
    it('消息队列正常工作', () => {})
  })
  describe('显示模块函数功能测试', () => {
    it('搜索词长度超限提示', () => {
      let keyword = '123天地玄黄，宇宙洪荒。日月盈昃，辰宿列张。寒来暑往，秋收冬藏。闰余成岁，律吕调阳。'
      expect(util.textByteLength(keyword)).to.equal(83)
      // 76为百度限制；百度似会转换中文逗号为英文逗号。不知道有没有其他未知的转换策略，
      expect(util.textColoredIgnorePart(keyword, 76)).to.equal( `123天地玄黄，宇宙洪荒。日月盈昃，辰宿列张。寒来暑往，秋收冬藏。闰余成岁，律${chalk.red("吕调阳。")}`)
    
    })
    it('搜索结果简介的中文关键词着色', () => {
      let keyword = '天下'
      let text = '先天下之忧而忧，后天下之乐而乐'
      let coleredText = util.keywordColor( text,  keyword )
      // \u001b[91m 为 redBright 颜色
      expect(coleredText).to.equal(`先${chalk.redBright('天下')}之忧而忧，后${chalk.redBright('天下')}之乐而乐`)
    })
    it('正确数据结构的正确显示', () => {
      let linkArray = [{
        title:'百度',
        description: '众里寻她千百度，蓦然回首',
        url:'http://www.baidu.com/'
      },
      {
        title:'谷歌',
        description: '宋有农，作《打谷歌》，诵凡百度',
        url:'http://www.google.com/'
      }]
      console.log(chalk.dim('\t由于显示变化较多，此测试不作断言:'))
      // util.combineResultToPrint(linkArray, '百度', {urlExpansion:true} ).map(item=>console.log(item))
    })
    it('site inurl filetype的搜索', () => {expect(false).to.be.true})
  })
  describe('REPL交互解释器模块', () => {
    it('操作url', () => {
      let target = ''
      let copy = (src) => { target = src }
      let testArray = [{url:'http://www.baidu.com'},{url:'http://www.sina.com.cn'}]
      util.verifyIndiceAndOperateUrl(1, testArray , copy )
      expect(target).to.be.equal( testArray[0].url )
    })

    it('', () => {})
    it('', () => {})
  })

  describe('搜索历史模块', () => {
    it('', () => {})
  })

 // it('baidu-search依赖包返回正确数据', () => {baidu })
 // it('baidu-search依赖包返回正确数据', () => {baidu })
/*
  it('copy existing config with comment to target file', () => {
    let fromPath ='./mock-copy-js/from.js'
    let toPath ='./mock-copy-js/to.js'
    
    const config = copyExistingComments(require(fromPath),path.resolve(__dirname,fromPath))
    expect(config).to.equal(fs.readFileSync(toPath, 'utf-8'))
  })

  it('prompt questions and get correct options array',async () => {
    monkeyPatchInquirer( answers )
    const meta = await promptForMeta('oooj', questions )
    expect(meta).to.be.an('Object')
    if (meta.length > 0 ) {
      let packageJson = meta['package.json']
      let configJs = meta['config.js']
      let settings = meta['__notFile__butSettings__']
      packageJson && expect(packageJson).to.have.property('description')
      configJs && expect(configJs).to.have.property('isMobile')
      settings && expect(settings).to.have.property('autoInstall')
    }
  })

  it('prompt stuff correctly add to target file: package.json and config.js', async () => {
    monkeyPatchInquirer( answers )
    console.log('creating mock project for test')
    await startCreate(PROJECT_NAME, questions, MOCK_TEMPLATE_PATH)
    console.log('created, start testing')

    expect(fs.existsSync(`${MOCK_TEMPLATE_BUILD_PATH}/webpack/config.js`)).to.equal(true)
    let config = require(`${MOCK_TEMPLATE_BUILD_PATH}/webpack/config.js`)
    expect( config.i18n ).to.equal( answers.i18n )

    expect(fs.existsSync(`${MOCK_TEMPLATE_BUILD_PATH}/package.json`)).to.equal(true)
    let packageJson = require(`${MOCK_TEMPLATE_BUILD_PATH}/package.json`)
    expect( packageJson.name ).to.equal( answers.name )
    console.log('test finished. deleting mock project')
  })
*/
})

