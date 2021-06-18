// appi.js
// 서버 단에서 실행되는 main 파일
const express = require('express');
const mysql = require('mysql')
const convert = require('xml-js');
const autoUpdate = require('./wordUpdate');
const fetch = require("node-fetch");
const cors = require('cors')
const db = require('./config/config.json')['db']
const app = express();

// 프론트 단에서 발생하는 cors 에러를 방지하기 위함 
const corsConfig = {
    origin : 'http://localhost:3000',
    credentials : true
}

// db config
const config = mysql.createConnection({
    host : 'localhost',
    user : db.username,
    password : db.password,
    database : db.database
});

app.use(express.json());
app.use(cors(corsConfig));

app.listen(4000, () => `listening at http://localhost:4000`);

// 단어 create
app.post('/create', (req, res) => {
    var sql = 'INSERT INTO word(id, word, mean) values (?, ?, ?)';
    const body = req.body

    const resbody = {
        result : 'true'
    }

    config.query(sql, [body.id, body.word, body.mean], 
        (err, rows, fields) => {
            if (err) {
                console.log(err)
                resbody.result = false
            } else{
                resbody.result = true
            }
            res.send(resbody)
    });
});

// 중복단어를 확인하기 위해
const usedWord = new Set([]);

// 끝글자로 시작하는 단어 read API
app.get('/rear/:word', (req, res) => {
    usedWord.add('\'' + req.params.word + '\'')

    var lasText = req.params.word.slice(-1);
    // 해단 단어의 끝글자로 시작하는, 그러나 사용되지 않은 단어를 DB에서 불러옴
    var sql = `SELECT * FROM word WHERE word LIKE '${lasText}%' AND word NOT IN (${[...usedWord]}) ORDER BY rand() limit 1`;

    config.query(sql, (err, rows, fields) => {
        if (!err) {
            res.send(rows[0])
            if(rows[0])
                usedWord.add('\'' + rows[0].word + '\'')
        } else{
            console.log('errer : ', err)
            res.status(500).send('errer')
          };
    })
})


// word search API
app.get('/search/:word', (req, res) => {
    var word = req.params.word;

    // 우리말샘에서 제공하는 open api 사용
    // 사전에 입력된 단어와 동일한 명사가 있는지 검색
    fetch(encodeURI(`https://opendict.korean.go.kr/api/search?key=050AEFC08F45C6E473EC11CAA3C27F13&q=${word}&advanced=y&pos=1`))
        .then(res => res.text())
        .then(r => {
            // 응답이 xml이므로..
            const resJson = convert.xml2json(r, {compact: true, spaces: 4})
            res.send(resJson)
        })
})

// 새로운 단어를 불러오기 위한 API
app.get('/newWord/:word', (req, res) => {
    var word = req.params.word;

    // 우리말샘에서 제공하는 open api 사용
    // 입력된 단어의 끝글자로 시작하는, 2음절이상 5음절 이하의 명사를 많이 찾는 순으로 30개 불러옴
    fetch(encodeURI(`https://opendict.korean.go.kr/api/search?key=050AEFC08F45C6E473EC11CAA3C27F13&q=${word[word.length - 1]}&num=30&sort=popular&advanced=y&pos=1&integer=1&method=start&letter_s=2&letter_e=5`), {
        })
            .then(res => res.text())
            .then(result => {
                const resJson = convert.xml2json(result, {compact: true, spaces: 4})
                res.send(resJson)
            })
})

// 중복된 단어 찾기 aPI
app.get('/overlap/:word', (req, res) => {
    var sql = 'SELECT * FROM word WHERE word=?'
    var word = req.params.word;

    const resbody = {
        overlap : 'true'
    }

    // 사용자의 단어를 저장할 경우, DB에 존재하는 단어인지 알기 위해
    config.query(sql, [word], (err, rows) => {
        if(!err) {
            // 존재하지 않다면 저장
            if(!rows.length) {
                resbody.overlap = false
            } else{
                resbody.overlap = true
            }
            res.send(resbody)
        } else {
            console.log('errer : ', err)
            res.status(500).send('errer!')
        }
    })
})

// 저장된 단어의 갯수 read API
app.get('/count', (req, res) => {
    var sql = 'SELECT COUNT(*) AS count FROM word';

    config.query(sql, (err, rows, fields) => {
        if (!err) {
            res.send(rows[0])
            // 새로고침 시에만 불러오는 함수이므로, 새로고침 시 사용된 단어 reset
            usedWord.clear();
        } else{
            console.log('errer : ', err)
            res.status(500).send('errer!')
          };
    })
})