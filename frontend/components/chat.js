// Chat.js
// 채팅 내용을 렌더링하기 윈한 컴포넌트

import styles from '../styles/chat.module.css';
import classnames from 'classnames'
import { AiFillRobot } from "react-icons/ai";
import ScrollableFeed from 'react-scrollable-feed'
import { useState } from 'react'
import MeanModal from './meanModal'

export default function Chat({chatList}){
    // meanModal을 열기위한 State
    const [ isOpen, setIsOpen ] = useState({ value :false });

    // isOpen을 true로 설정하여 modal open
    // 해당 단어의 modal만 열기 위해 단어도 함께 저장
    const openModal = (word) => {
        setIsOpen({
            value : true,
            word : word
        })
    }

    // isOpen을 false로 설정하여 modal close
    // meanModal에 전달
    const closeModal = () => {
        setIsOpen({ value :false })
    }

    return (
        <ScrollableFeed className={styles.chatMain}>{
             // 채팅 내용이 없다면 아무것도 렌더링하지 않는다.
            chatList.length ?
                chatList.map(chat => 
                    <div className={classnames(styles.chat,chat.talker=="bot" ? styles.botChat : styles.userChat)}>{
                        // talker에 따라 컴포넌트의 세부적인 내용이 다름
                        // talker - bot : 로봇 아이콘 추가, 클릭 가능, meanModal을 가짐
                        // talker - user : 클릭 불가,  meanModal을 가지지 않음
                        chat.talker=="bot" ? 
                            <div className={classnames(styles.chat,styles.botChat)}>
                                <AiFillRobot className={styles.icon}/>
                                <div className={classnames(styles.chatText, styles.botChatText)} onClick={() => openModal(chat.word)}>
                                    {  chat.word.split('\n').map( line => 
                                            <span>{`${line}`}<br/></span>
                                        ) }
                                </div>{
                                // isOpen을 true로 설정하여 modal open, 저장된 단어를 비교하여 클릭한 단어의 뜻만 보여준다.
                                isOpen.value && (isOpen.word == chat.word) ? 
                                    <MeanModal mean={chat.mean} onClose={closeModal}/> : null}
                            </div> :
                            <div className={classnames(styles.chatText, styles.userChatText)}>
                            {  chat.word.split('\n').map( line => 
                                    <span>{`${line}`}<br/></span>
                                ) }
                        </div>}
                    </div> ) : null}
        </ScrollableFeed>
  )
}
