// meanModal.js
// 단어의 뜻을 보여주기 위한 Modal
import styles from "../styles/meanModal.module.css"

export default function Chat({mean, onClose}){
    return (
        <div onClick={onClose}>{
            // 뜻이 있는 경우에만 보여줌 
            mean ? 
                <main className={styles.modal}>
                    <span>{mean}</span>
                </main> : null }
            
        </div>
  )
}
