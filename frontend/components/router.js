// router.js
// api 호출을 위한 라우터
import axios from 'axios'

// Create api 호출
const createWord = async(id, word, mean) => {
    return await axios.post(`http://localhost:4000/create`,{
        'id': id,
        'word': word,
        'mean' : mean
    })
    .then(res => { return res.data})
    .catch(error => {
        console.log(error)
    })
}

// 저장된 단어의 갯수 read api 호출
const readWordCount = async() => {
    return await axios.get(`http://localhost:4000/count`)
        .then(res => {return res.data.count})
        .catch(error => {
            console.log(error)
        })
}

// 끝말잇기용 단어 read api 호출
const readRearWord = async(word) => {
    return await axios.get(`http://localhost:4000/rear/${word}`)
        .then(res => {
            console.log(res)
            return {
                word : res ? res.data.word : null,
                mean : res ? res.data.mean : null
            }
        })
        .catch(error => {
            console.log(error)
        })
}

// 중복여부 검사를 위한 api 호출
const searchOverlap =  async(word) => {
    return await axios.get(`http://localhost:4000/overlap/${word}`)
        .then(res => {return res.data.overlap})
        .catch(error => {
            console.log(error)
        })
}

// 입려된 단어가 올바른 명사인지 검사하기 위한 api 호출
const searchDir = async(word) => {
    return await axios.get(`http://localhost:4000/search/${word}`)
        .then(res => {
            return {
            num : res.data.channel.num._text,
            item : Array.isArray(res.data.channel.item) ? res.data.channel.item : [res.data.channel.item]
        }})
        .catch(error => {
            console.log(error)
        })
}

// 새로운 단어를 불러오기 위한 api 호출
const searchDirRearWord = async(word) => {
    return await axios.get(`http://localhost:4000/newWord/${word}`)
        .then(res => {
            // 동음이의어를 체크하여, 동음이의어일 경우 하나만 저장
            let num = res.data.channel.num._text
            const itemList = Array.isArray(res.data.channel.item)  ? [...res.data.channel.item] : [res.data.channel.item]
            
            const wordList = new Set([])
            const dupIndex = []
            
            itemList.map((item, i) => {
                const word = item.word._text
                console.log(word)
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

            console.log('추가된 단어 : ', wordList)
           
            return {
                num : num,
                item : itemList
            }
        }).catch(error => {
            console.log(error)
        })
}

export {searchOverlap, searchDir, createWord, readWordCount, readRearWord, searchDirRearWord};