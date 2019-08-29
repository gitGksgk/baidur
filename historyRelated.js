const fs = require('fs-extra')

function dateNowString(){
  let date = new Date()
  return dateFormat("YYYY-mm-dd HH:MM:SS", date)
}
function dateFormat(fmt, date) {
    let ret;
    let opt = {
        "Y+": date.getFullYear().toString(),        // 年
        "m+": (date.getMonth() + 1).toString(),     // 月
        "d+": date.getDate().toString(),            // 日
        "H+": date.getHours().toString(),           // 时
        "M+": date.getMinutes().toString(),         // 分
        "S+": date.getSeconds().toString()          // 秒
        // 有其他格式化字符需求可以继续添加，必须转化成字符串
    };
    for (let k in opt) {
        ret = new RegExp("(" + k + ")").exec(fmt);
        if (ret) {
            fmt = fmt.replace(ret[1], (ret[1].length == 1) ? (opt[k]) : (opt[k].padStart(ret[1].length, "0")))
        };
    };
    return fmt;
}

// 目前只能用全部读入再写的方法; 测得400w条时300ms
function historyInitStamp(filePath, initString) {
    // mode 0o0600 copy from nodejs/internal/repl/history.js
    try{
      fs.ensureFileSync(filePath)
      let currentHistory = fs.readFileSync(filePath , 'utf8')
      let hnd = fs.openSync(filePath , 'w+', 0o0600 );
      fs.writeFileSync(hnd,  initString + currentHistory , 'utf8');
      fs.closeSync(hnd);
    }
    catch (err) {
      // Cannot open history file.
      // Don't crash, just don't persist history.
      console.log('\nError: Could not open history file.\n' +
        'REPL session history will not be persisted.\n');
      console.log(err.stack);
    }
}

module.exports = {
  dateNowString,
  historyInitStamp
}
