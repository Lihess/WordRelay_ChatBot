// resultModal.js
// 게임의 승패 결과를 알려주는 Modal
import { BiReset } from "react-icons/bi";
import styles from "../styles/resultModal.module.css"

export default function Chat({winner, descript, onClose}){
    return (
        <div className={styles.background}>
            <main className={styles.modal}>{
                // 승리자에 따라 다른 문구 출력
                winner == 'user' 
                    ? <span className={styles.winText}>WIN!!!</span> 
                    : <span className={styles.lostText}>LOSE...</span>}
                <span className={ styles.descript }>{descript}</span>
                
                <div className={styles.reset} onClick={onClose}>
                    <BiReset className={styles.icon} size="18"/>
                    <span>다시하기</span>
                 </div>
            </main>
        </div>
  )
}
