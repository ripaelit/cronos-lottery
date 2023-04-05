import { memo, useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { providers, Contract } from 'ethers'
import MetaMaskOnboarding from '@metamask/onboarding'
import { ContractAddress, chainConfig } from '../../constants'
import abi from '../../constants/abi.json'
import useMedia from '../../hooks/useMedia'

import {
  connectAccount,
  onLogout,
  setShowWrongChainModal,
  chainConnect
} from '../../globalState/user'

import styles from '../../styles/Component.module.scss'

let lotteryContract, provider

const WalletConnectButton = () => {
  const dispatch = useDispatch()
  const isMobile = useMedia('(max-width: 1200px)')
  const [bought, setBought] = useState(-1)
  const [hrgls, setHrgls] = useState(false);

  const walletAddress = useSelector((state) => {
    return state.user.address
  })

  const correctChain = useSelector((state) => {
    return state.user.correctChain
  })
  const user = useSelector((state) => {
    return state.user
  })
  const needsOnboard = useSelector((state) => {
    return state.user.needsOnboard
  })

  const connectWalletPressed = async () => {
    if (needsOnboard) {
      const onboarding = new MetaMaskOnboarding()
      onboarding.startOnboarding()
    } else {
      dispatch(connectAccount())
    }
  }

  useEffect(() => {
    let defiLink = localStorage.getItem('DeFiLink_session_storage_extension')
    if (defiLink) {
      try {
        const json = JSON.parse(defiLink)
        if (!json.connected) {
          dispatch(onLogout())
        }
      } catch (error) {
        dispatch(onLogout())
      }
    }
    if (
      localStorage.getItem('WEB3_CONNECT_CACHED_PROVIDER') ||
      window.ethereum ||
      localStorage.getItem('DeFiLink_session_storage_extension')
    ) {
      if (!user.provider) {
        if (window.navigator.userAgent.includes('Crypto.com DeFiWallet')) {
          dispatch(connectAccount(false, 'defi'))
        } else {
          dispatch(connectAccount())
        }
      }
    }
    if (!user.provider) {
      if (window.navigator.userAgent.includes('Crypto.com DeFiWallet')) {
        dispatch(connectAccount(false, 'defi'))
      }
    }

    // eslint-disable-next-line
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setHrgls(oldVal => !oldVal);
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!walletAddress) {
      return
    }
    const init = async () => {
      try {
        provider = new providers.JsonRpcProvider(chainConfig.rpcUrls[0])
        lotteryContract = new Contract(
          ContractAddress,
          abi,
          provider
        );
        lotteryContract.getUserTickets(walletAddress).then(userTickets => setBought(userTickets.toNumber()))
      } catch (err) {
        console.log('Error getting endtime:', err)
      }
    }
    init()
  }, [walletAddress, hrgls])

  const onWrongChainModalChangeChain = () => {
    dispatch(setShowWrongChainModal(false))
    dispatch(chainConnect())
  }

  const logout = async () => {
    dispatch(onLogout())
  }

  return (
    <div>
      {!walletAddress && (
        <button
          className={styles.WalletClickButton}
          onClick={() => connectWalletPressed()}
        >
          Connect Wallet
        </button>
      )}
      {walletAddress && !correctChain && !user.showWrongChainModal && (
        <button
          className={styles.WalletClickButton}
          onClick={() => onWrongChainModalChangeChain()}
        >
          Switch Network
        </button>
      )}

      {walletAddress && (
        <div className={styles.walletButtonContainer}>
          {
            isMobile ? <button className={styles.WalletButton} onClick={() => logout()}>
              {walletAddress.substr(0, 6) +
                '...' +
                walletAddress.substr(walletAddress.length - 4, 4)}
            </button> : bought >= 0 && <div className={styles.boughtText}>{bought} TICKET(S) BOUGHT</div>
          }
          {
            isMobile ? bought >= 0 && <div className={styles.boughtText}>{bought} TICKET(S) BOUGHT</div> : <button className={styles.WalletButton} onClick={() => logout()}>
              {walletAddress.substr(0, 6) +
                '...' +
                walletAddress.substr(walletAddress.length - 4, 4)}
            </button>
          }

        </div>
      )}
    </div>
  )
}
export default memo(WalletConnectButton)
