// index.js
// 메인화면으로, "http://localhost:3000"로 들어가면 나오는 화면

import Head from 'next/head'
import styles from '../styles/Home.module.css'
import Chat from '../components/chat'
import ResultModal from '../components/resultModal'
import { useEffect, useState } from 'react'
import { createWord, readWordCount, readRearWord,searchDirRearWord, searchOverlap, searchDir } from '../components/router'


export default function Home({count}) {
    const [ wordCount, setWordCount ] = useState(count); // DB에 저장된 단어의 갯수
    const [ chatList, setchatList ] = useState([{talker : 'bot', word : '끝말잇기를 시작합니다.\n 제시어를 말해주세요 :)'}]) // chatList
    const [ text, setText ] = useState(); // input에서 받는 입력 텍스트
    const [ isEnd, setIsEnd ] = useState({ value : false}) // 게임의 종료 여부
    const [ isTextNotValue, setIsTextNotValue ] = useState(false) // 텍스트의 유효성 검사를 위한 변수

    // chatList 변수의 변경에 따라 실행되는 함수
    // chatList 변수가 변경되면 사용자의 입력이 들어왔다 판단, 해당 단어가 명사인지 검색하고 DB에서 끝말잇기용 단어를 가져옴
    useEffect(() => {
        // 사용자의 채팅이 변할때만 작용하기 위해서
        if (!isEnd.value && (chatList[chatList.length -1].talker == 'user')) {
            searchDir(text)
                .then(res => {
                    if(res && res.num > 0) {
                        const wordMean = res.item[0].sense.definition._text.split('.');
                        addWord(wordCount + 1, text, wordMean[0])
                    
                        getRearWord()
                    } else if (text) {
                        // 검색결과가 없다면 명사가 아닌 단어를 입력한 것
                        setIsEnd({
                            value : true,
                            winner : 'bot',
                            descript : '명사가 아닌 단어를 사용하였습니다!'
                        })
                    }

                })
        }

        setText('');
    },[chatList])

    // 사용자가 입력한 단어를 검사하기 위한 함수
    const checkWord = () => {
        const frontWord = chatList[chatList.length - 1].word
       
        if(chatList.length > 1) {
            // 이전의 단어의 끝글자와 입력된 단어의 앞 글자가 같은지  
            if(text[0] == frontWord[frontWord.length - 1]) {
                const isDup = chatList.some((chat) => {
                    return chat.word == text
                });

                // 중복 여부 검사
                if (isDup){
                    setIsEnd({
                        value : true,
                        winner : 'bot',
                        descript : '단어가 중복되었습니다!'
                    });
                }
            }
            else {
                setIsEnd({
                    value : true,
                    winner : 'bot',
                    descript : '알맞지 않은 단어입니다!'
                });
            }
        }
    }

    // 단어 추가 함수
    const addWord =  async(id, word, mean) => {
        // 해당 단어가 DB에 존재한지 검사
        await searchOverlap(word)
            .then(res => {
                // 존재하지 않다면 저장 API를 불러옴
                if(!res){
                    createWord(id, word, mean);
                    setWordCount(wordCount + 1)
                }
                else {
                    console.log('word creat fail..')
                }
            })
    }

    // 입력된 단어에 알맞는 끝말잇기 단어를 DB에서 검색함
    const getRearWord = () => {
        readRearWord(text)
            .then(res => {
                if(res.word){
                    setchatList([...chatList,{
                        talker : 'bot',
                        word : res.word,
                        mean : res.mean
                    }])}
                else {
                    // 만약 DB에 없다면 사용자가 승리
                    setIsEnd({
                        value : true,
                        winner : 'user',
                        descript : '당신이 이겼습니다! 강해져서 돌아올게요!'
                    }); 
                    getNewWord();
                }
            });
    }
    
    // 챗봇이 게임에서 졌을 경우, 사전에서 해당 문자로 시작하는 단어를 가져와 DB에 저장
    const getNewWord = () => {
        searchDirRearWord(text)
            .then(res => {
                if(res && res.num > 0) {
                    res.item.map((newWord, i) => {
                        const id = wordCount + i + 1;
                        const replaceWord = newWord.word._text.replace('-','');
                        const wordMean = newWord.sense.definition._text.split('.');
                        
                        addWord(id, replaceWord, wordMean[0])
                    })

                    setWordCount(Number(wordCount) + Number(res.num))
                }
            })
    }


    // 입력된 단어는 chatlist에 넣는 함수
    const inputChat = async() => { 
         // 해당 단어는 반드시 2음절 이상이어야 한다.
         if (text.length >= 2) {
            setIsTextNotValue(false);
            checkWord(text);
            
            setchatList([...chatList, {
                talker : 'user',
                word : text
            }])
        }
        else {
            setIsTextNotValue(true);
        }
    }
    
    // input에 입력된 text를 검사하는 함수
    const onKeyPress = (e) => {
        // Enter를 입력해도 입력내용 제출 가능
        if(e.key == 'Enter') 
                inputChat()
    }

    // input에 입력 중인 text를 검사하는 함수
    const onChange = (e) => {
        // 한글만 입력가능
        if(/([^가-힣ㄱ-ㅎㅏ-ㅣ\x20])/i.test(e.target.value))
            setIsTextNotValue(true);
            
        else {
            setIsTextNotValue(false);
            setText(e.target.value);
        }
        setText(e.target.value);
    }

    // modal 창을 닫기위한 함수
    // 창을 닫을 경우, 모든 state이 reset된다.
    const closeModal = () => {
        setIsEnd({value : false})
        setchatList([{talker : 'bot', word : '끝말잇기를 시작합니다.\n 제시어를 말해주세요 :)'}])
        setText('')
        setIsTextNotValue(false)
        readWordCount().then(res => setWordCount(res))
    }


    return (
        <div className={styles.container}>
            <Head>
                  <title>학습형 끝말잇기</title>
                  <meta name="description" word="Generated by create next app" />
                  <link rel="icon" href="/favicon.ico" />
            </Head>

            <main className={styles.main}>
                  <div className={styles.title}>
                      <h1> 학습형 끝말잇기 챗봇 </h1>
                      <div className = {styles.subtitle}>
                          <span> 현재   </span>
                          <span className = {styles.wordNum}>   {wordCount}</span>
                          <span>개의 단어가 등록되어 있습니다.</span>
                      </div>
                  </div>

                  <div className={styles.chatBox}>
                        <Chat chatList = {chatList}/>
                        <div className={styles.inputBox}>
                            <input type = 'text' value = {text} placeholder={'Input word'} onChange = {onChange} onSubmit = {inputChat} onKeyPress = {onKeyPress}/>
                            <button onClick={inputChat}>{`>`}</button>
                        </div>
                  </div>
                  { // 유효하지 않는 text의 경우 info 문구를 보여준다.
                    isTextNotValue ? <div className={styles.info}>2음절 이상의 한글만 입력 가능합니다.</div>:null}
            </main>
            
            { // isEnd 값에 따라 modal 창을 연다.
            isEnd.value ? <ResultModal winner={isEnd.winner} descript={isEnd.descript} onClose={closeModal} /> : null }
        </div>
  )
}

// 렌더링 전에 가져와야할 count 변수를 가져오기 위함.
export async function getServerSideProps(){
    const count =  await readWordCount()
    return {props : {count}}
}

