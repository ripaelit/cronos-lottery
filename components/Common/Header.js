import { useState, useEffect } from 'react'
import { useSelector } from "react-redux"
import { toast } from "react-toastify"
import { useRouter } from 'next/router'

import WalletConnectButton from '../Wallet/WalletConnectButton'
import { chainConfig } from '../../constants'

import styles from '../../styles/Component.module.scss'
import Link from 'next/link'
import MobileSideBar from './MobileSideBar'

const errorAlert = (title, err) => {
  console.log(title, JSON.stringify(err))
  toast.error(`${title} ${JSON.stringify(err)}`)
}

const Header = () => {
  const [activeId, setActiveId] = useState(0);

  const router = useRouter();

  const walletAddress = useSelector((state) => {
    return state.user.address;
  });

  const correctChain = useSelector(state => state.user.correctChain)
  const isMetamask = useSelector(state => state.user.isMetamask)

  const menuLists = [
    { id: 0, title: `Home`, link: '/home' },
    { id: 1, title: `Play`, link: '/play' },
    { id: 2, title: `Redeem`, link: '/redeem' },
  ]

  const handleActiveId = (idx) => {
    if (idx === 0 || idx) {
      setActiveId(idx)
    }
  }

  useEffect(() => {
    (async () => {
      try {
        if (!!walletAddress && isMetamask && !!window && !!window.ethereum && !correctChain) {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: chainConfig.chainId }],
          });
        }
      } catch (switchError) {
        if (switchError.code === 4902) {
          try {
            await window.ethereum.request({
              method: "wallet_addEthereumChain",
              params: [chainConfig],
            });
          } catch (err) {
            return errorAlert("error adding chain:", err)
          }
          return errorAlert('error switching chain:', switchError)
        }
      }
    })();
  }, [walletAddress])

  useEffect(() => {
    const res = menuLists.filter((item) => item.link === router.asPath)
    setActiveId(res[0]?.id)
  }, [router])

  return (
    <>
      <MobileSideBar pageWrapId={"page-wrap"} outerContainerId={"App"} left />
      <div className={styles.HeaderSection} >
        <div className={styles.HeaderControl} >
          <div className={styles.HeaderLeft} >
            <Link href='/home'>
              <div className={styles.Logo} >
                <img src='images/logo.png' alt='' className={styles.hideMobile} />
                <img src='images/small_logo.png' alt='' className={`${styles.showMobile} ${styles.mobileLogo}`} />
              </div>
            </Link>
            <div className={styles.HeaderMenu} >
              {
                menuLists.map((menu, idx) =>
                  <Link href={menu.link} key={idx} onClick={() => handleActiveId(idx)}>
                    <p className={idx === activeId ? styles.menuActive : styles.menuPassive} > {menu.title} </p>
                  </Link>
                )
              }
            </div>
          </div>
          <WalletConnectButton />
        </div>
      </div>
    </>
  )
}

export default Header