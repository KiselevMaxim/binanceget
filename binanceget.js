const axios = require("axios");
var XLSX = require('xlsx');

let resArr = [['tickPairTf', 'tickKey', 'O', 'C', 'bit0UP']]

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// Iterator for batches
function it(cnt) {
	let res = []
	for(let i=0; i<=cnt; i++){
    	res.push(i)
    }
    return res
}

// Core function getting data from binance, parsing it and writing to XLS file
const getBinanceData = async (tF, tickPair, binanceTF, batches, limit) => {
    let tickPairTf = tickPair + '_' + tF
    let startTime = 1502942400000
    let endTime   = Date.now()
    for (index of it(batches)) {
        try {
            let res = await ReqLines(tF, tickPair, binanceTF, startTime, endTime, limit)            
            if (isNaN(res.startTime)) {
                startTime = endTime
                Array.prototype.push.apply(resArr, res.res)
                //console.log('startTime = ', startTime, 'index= ', index)
                break
            }
            startTime = res.startTime/100000
            Array.prototype.push.apply(resArr, res.res)
            //console.log('startTime = ', startTime, 'index= ', index)            
        } catch (err) {
            console.log('Error request binance', err);
        }
    }
    console.log('done')
    await delay(900)
    makeXLSX(tickPairTf+'.xlsx', tickPairTf, resArr)
}

// Parse data from binance response and returns formated result
const ReqLines = async (tF, tickPair, binanceTF, startTime, endTime, limit) => {
    let tickPairTf = tickPair + '_' + tF
    let resArr = []
    let startTimeres
    //console.log('ReqLines startTime = ', startTime)
    const url = 'https://api.binance.com/api/v3/klines?symbol='+tickPair+'&interval='+binanceTF+'&startTime='+startTime+/*'&endTime='+endTime+*/'&limit='+limit // '&endTime='+endTime+
    //console.log(url)
    try {
        const response = await axios.get(url);
        const bodyArr = response.data;
        for (element of bodyArr) {
            O          = parseInt(element[1] * 100000)
            H          = parseInt(element[2] * 100000)
            L          = parseInt(element[3] * 100000)
            C          = parseInt(element[4] * 100000)
            startTimeres=parseInt(element[6] * 100000)
            _bit       = C >= O ? 0 : 1 // 0-UP 1-DOWN
            let _now = new Date(element[0])
            let _now_t = new Date(_now.getTime())  
            let tickKey = _now_t.getUTCFullYear() + (_now_t.getUTCMonth()+101).toString().substring(1, 3) + (_now_t.getUTCDate()+100).toString().substring(1, 3) + '_' + 
                (_now_t.getUTCHours()+100).toString().substring(1, 3) + (_now_t.getUTCMinutes()+100).toString().substring(1, 3)
            resArr.push([tickPairTf,     tickKey,   O,   C, _bit])                
        };
      } catch (error) {
        console.log(error);
      }
    return {startTime: startTimeres, res: resArr}
}

// Creates XLS file, workbook, and writes data
const makeXLSX = (filename, ws_name, data) => {
    var wb = XLSX.utils.book_new(), ws = XLSX.utils.aoa_to_sheet(data);
    /* add worksheet to workbook */
    XLSX.utils.book_append_sheet(wb, ws, ws_name);
    /* write workbook */
    XLSX.writeFile(wb, filename);
}
getBinanceData('M5','BTCUSDT', '5m', 308 /*batches*/ , 1000 /*records in batch*/) // get data by batches, set records per one batch. Batches divided by delay 0.9 sec