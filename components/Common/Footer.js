import styles from '../../styles/Component.module.scss'

const Footer = () => {
  return (
    <div className={styles.Footer} >
      <div className={styles.Footer_container} >
        <div className={styles.Footer_control} >
          <a target='_blank' rel="noreferrer" href='https://app.ebisusbay.com/collection/trooprz'><img src='/images/trooprz.png' /></a>
          <a target='_blank' rel="noreferrer" href='https://app.ebisusbay.com/collection/super-trooprz'><img src='/images/super.png' /></a>
          <a target='_blank' rel="noreferrer" href=' https://app.ebisusbay.com/collection/trooprz-mutantz'><img src='/images/mutantz.png' /></a>
          <a target='_blank' rel="noreferrer" href='https://discord.gg/trooprz '><img src='/images/discord.png' /></a>
        </div>
        <div className={styles.Footer_text}>
          Copyright &nbsp;<a target='_blank' rel="noreferrer" href='https://discord.gg/trooprz'> Trooprz</a>&nbsp; © 2023  | Developed by CRMax | Powered by the&nbsp;<a target='_blank' rel="noreferrer" href='https://witnet.io/'>Witnet oracle</a>
        </div>
      </div>
    </div>
  )
}

export default Footer