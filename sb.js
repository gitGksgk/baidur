var program = require('commander')

// program.arguments('[searchText...]')
//         .action( (a) => {
//   console.log('a',a)//,'b',b,'c',c)
// })
// 
// console.log(program.parse(process.argv))

let log = console.log
let str1 = 'aaa哦{)(*&^%$#@!'
log(str1.length)
log(st(str1))

let str2 = '）（*&……%@～！'
log(str2.length)
log(st(str2))
function st(s){
  let length = s.length
  for( let str of s){
    if( str.charCodeAt() >= 128 )
      log(str)
      length ++ 
  }
  return length
}
