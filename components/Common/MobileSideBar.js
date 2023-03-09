import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import MetaMaskOnboarding from "@metamask/onboarding";
import { slide as Menu } from "react-burger-menu";
import Link from "next/link";
import { useRouter } from 'next/router'

import {
  connectAccount,
  onLogout,
  setShowWrongChainModal,
  chainConnect,
} from "../../globalState/user";

import styles from '../../styles/Component.module.scss'

const MobileSideBar = (props) => {
  const dispatch = useDispatch();
  const [activeId, setActiveId] = useState(0)

  const router = useRouter();
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

  const walletAddress = useSelector((state) => {
    return state.user.address;
  });

  const correctChain = useSelector((state) => {
    return state.user.correctChain;
  });
  const user = useSelector((state) => {
    return state.user;
  });
  const needsOnboard = useSelector((state) => {
    return state.user.needsOnboard;
  });

  const connectWalletPressed = async () => {
    if (needsOnboard) {
      const onboarding = new MetaMaskOnboarding();
      onboarding.startOnboarding();
    } else {
      dispatch(connectAccount());
    }
  };

  useEffect(() => {
    let defiLink = localStorage.getItem("DeFiLink_session_storage_extension");
    if (defiLink) {
      try {
        const json = JSON.parse(defiLink);
        if (!json.connected) {
          dispatch(onLogout());
        }
      } catch (error) {
        dispatch(onLogout());
      }
    }
    if (
      localStorage.getItem("WEB3_CONNECT_CACHED_PROVIDER") ||
      window.ethereum ||
      localStorage.getItem("DeFiLink_session_storage_extension")
    ) {
      if (!user.provider) {
        if (window.navigator.userAgent.includes("Crypto.com DeFiWallet")) {
          dispatch(connectAccount(false, "defi"));
        } else {
          dispatch(connectAccount());
        }
      }
    }
    if (!user.provider) {
      if (window.navigator.userAgent.includes("Crypto.com DeFiWallet")) {
        dispatch(connectAccount(false, "defi"));
      }
    }

    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const res = menuLists.filter((item) => item.link === router.asPath)
    setActiveId(res[0]?.id)
  }, [router])

  const onWrongChainModalChangeChain = () => {
    dispatch(setShowWrongChainModal(false));
    dispatch(chainConnect());
  };

  const logout = async () => {
    dispatch(onLogout());
  };

  return (
    <Menu {...props}  >
      <div className={styles.MobileMenuContent} >
        <Link href='/home' ><img src='images/logo.png' /></Link>
        {
          menuLists.map((menu, idx) =>
            <Link href={menu.link} key={idx} >
              <p onClick={() => handleActiveId(idx)} className={idx === activeId ? styles.menuActive : styles.menuPassive} > {menu.title} </p>
            </Link>
          )
        }
        <div>
          {!walletAddress && (
            <button className={styles.MobileWalletButton}
              onClick={() => connectWalletPressed()}
            >
              Connect Wallet
            </button>
          )}
          {walletAddress && !correctChain && !user.showWrongChainModal && (
            <button className={styles.MobileWalletButton}
              onClick={() => onWrongChainModalChangeChain()}
            >
              Switch Network
            </button>
          )}

          {
            walletAddress &&
            <button className={styles.MobileWalletButton} onClick={() =>
              logout()
            } >{walletAddress.substr(0, 6) + '...' + walletAddress.substr(walletAddress.length - 4, 4)} </button>
          }
        </div>
      </div>
    </Menu>
  )
}
export default MobileSideBar