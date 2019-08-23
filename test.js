// const render = require('consolidate').handlebars.render
const { expect } = require('chai')
const fs = require('fs')
const path = require('path')

const chalk = require('chalk')
const log = console.log

const util = require('./util')
const baiduFetch = require('baidu-search')



describe('baidur',async () => {

  it('baidu-search依赖包返回正确数据', async () => {
    let testKeyword = '横扫千军如卷席'
    let page = 2
    let res = await new Promise( (resolve, reject) => {
      baiduFetch(testKeyword, page, (err,res) => {
        console.log(Object.keys(res))
        console.log( res.keyWord, res.beginPage, res.$, res.url, res.links)
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

 // it('baidu-search依赖包返回正确数据', () => {baidu })
 // it('baidu-search依赖包返回正确数据', () => {baidu })
 // it('baidu-search依赖包返回正确数据', () => {baidu })
 // it('baidu-search依赖包返回正确数据', () => {baidu })
 // it('baidu-search依赖包返回正确数据', () => {baidu })
 // it('baidu-search依赖包返回正确数据', () => {baidu })
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

