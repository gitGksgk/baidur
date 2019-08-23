const chalk = require('chalk')

/* 希望 中文2字节 英文、标点1字节；实现：ascii外的都算2字节
 * UTF-8 使用一至四个字节为每个字符编码。128 个 ASCII 字符（Unicode 范围由 U+0000 至 U+007F）只需一个字节，带有变音符号的拉丁文、希腊文、西里尔字母、亚美尼亚语、希伯来文、阿拉伯文、叙利亚文及马尔代夫语（Unicode 范围由 U+0080 至 U+07FF）需要二个字节，其他基本多文种平面（BMP）中的字符（CJK属于此类-Qieqie注）使用三个字节，其他 Unicode 辅助平面的字符使用四字节编码。
 * 将utf-8的认知转为baidu的规则
 */
function keywordByteLength(str){
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
function keywordIgnore(str){
  try {
    let length = str.length
    for( let s of str){
      if( s.charCodeAt() >= 128 )
      // console.log(str)
      length ++
      if( length > 76 )
      return str.slice(0,76) + chalk.red(str.slice(76))
    }
  }
  catch(e){
    console.log(e)
  }
}

module.exports={
  keywordByteLength,
  keywordIgnore
}
