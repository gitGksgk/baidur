var program = require('commander')

program.action( (a,b,c) => {
  console.log('a',a,'b',b,'c',c)
})
console.log(program.parse(process.argv))
