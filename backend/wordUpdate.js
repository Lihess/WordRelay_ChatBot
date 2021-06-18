// wordUpdate.js
// 단어를 자동으로 업데이트 하기 위함
const fetch = require("node-fetch");
const mysql = require('mysql')
const convert = require('xml-js');
const schedule = require('node-schedule');
const db = require('./config/config.json')['db']

const config = mysql.createConnection({
    host : 'localhost',
    user : db.username,
    password : db.password,
    database : db.database
});

// 스케줄러, 매일 12시간 간격으로 자동으로 실행됨
const autoUpdate = schedule.scheduleJob('* 12 * * *', async()=>{
    // DB에 저장된 단어 중 자신의 끝글자로 시작하는 DB 내의 다른 단어가 없는 단어를 찾는다.
    var sql = `SELECT x.word FROM word as x WHERE NOT EXISTS(SELECT * FROM word as y WHERE substr(x.word, -1) = substr(y.word, 1, 1)) ORDER BY rand() limit 1`;
    
    config.query(sql, (err, rows, fields) => { 
        if (!err) {
            if(rows[0]){
                var word = rows[0].word;
                var date = new Date()
                console.log("--- ", date.toLocaleString(), ".. \'", word, "\' 에 대응하는 단어를 찾아 저장합니다 --")

                fetch(encodeURI(`https://opendict.korean.go.kr/api/search?key=050AEFC08F45C6E473EC11CAA3C27F13&q=${word[word.length - 1]}&num=30&sort=popular&advanced=y&pos=1&integer=1&method=start&letter_s=2&letter_e=5`))
                    .then(res => res.text())
                    .then(result => {
                        // 동음이의어 처리
                        const resJson = JSON.parse(convert.xml2json(result,{compact: true, spaces: 4}))
                        let num = resJson.channel.num._text
                        const itemList = Array.isArray(resJson.channel.item)  ? [...resJson.channel.item] : [resJson.channel.item]

                        const wordList = new Set([])
                        const dupIndex = []

                        itemList.map((item, i) => {
                            const word = item.word._text
                            
                            if(wordList.has(word) || word.length == 1)
                                dupIndex.push(i)
                            else wordList.add(item.word._text)  
                            })
                        
                            if(dupIndex.length) {
                                num = num - dupIndex.length
                            
                                dupIndex.map((index, i) => {
                                    itemList.splice(index -i, 1)
                                })
                            }
                        // id를 생성하기 위해서
                        config.query('SELECT COUNT(*) AS count FROM word', (err, rows, fields) => {
                            if (!err) {
                                const wordCount = rows[0].count;
                    
                                itemList.map((newWord, i) => {
                                    const id = wordCount + i + 1;
                                    const replaceWord = newWord.word._text.replace('-','');
                                    const wordMean = newWord.sense.definition._text.split('.');
                                    
                                    createWord(id, replaceWord,wordMean[0])
                                })
                            } else{
                                console.log('errer : ', err)
                              };
                        })
                    })
                }
        } else{
            console.log('errer : ', err)
          };
    })
})

// DB에 word를 추가하는 함수
const createWord = (id, word, mean) => {
    var sql = 'INSERT INTO word(id, word, mean) values (?, ?, ?)';

    config.query(sql, [id, word, mean], 
        (err, rows, fields) => {
            if (!err) {
                console.log(word, " : 성공")
            } else{
                console.log(err)
            }
    });
}

module.exports = autoUpdate;