import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import Link from 'next/link'
import BigNumber from 'bignumber.js'
import { toast } from 'react-toastify';

import styles from '../styles/Redeem.module.scss'
import useInterval from '../hooks/useInterval'

const Redeem = () => {
  const [isLoading, setLoading] = useState(false)
  const [ticketPrice, setTicketPrice] = useState('0')
  const [isClaimable, setClaimable] = useState(false)
  const [MaxTicketCount, setMaxTicketCount] = useState(0)
  const [ticketCountByUser, SetTicketCountByUser] = useState(0)
  const [ticketAmount, setTicketAmount] = useState({
    common: 1,
    discount: 1
  })
  const [claimableAmount, setClaimableAmount] = useState('')
  const [ticketStatus, setTicketStatus] = useState(0)
  const [firstPotWinner, setFirstPotWinner] = useState('')
  const [timeStr, setTimeStr] = useState('')
  const [remainTime, setRemainTime] = useState(0)

  const STATUS = {
    pending: 0,
    open: 1,
    close: 2,
    Claimable: 3
  }

  const walletAddress = useSelector(state => state.user.address);

  const buyContract = useSelector(state => state.user.buyContract);

  const handleClaimWinnings = async () => {
    try {
      setLoading(true)

      const tx = await buyContract.claimRewards();
      await tx.wait()

      setLoading(false)
      toast.success('Successfully claim ')

    } catch (err) {
      // console.log('error:', err)
      toast.error('Error')
      setLoading(false)
    }
  }

  useEffect(
    async () => {
      if (!buyContract) {
        return
      }
      buyContract.lotteryStatus().then(newStatus => setTicketStatus(newStatus))
      buyContract.ticketPrice().then(newPrice => setTicketPrice(newPrice.toString()))
      buyContract.maxNumberTicketsPerBuy().then(newMax => setMaxTicketCount(newMax))
      buyContract.getWinnersByPot(1).then(firstPotWinners => setFirstPotWinner(firstPotWinners.length > 0 ? firstPotWinners[0] : ''))
      buyContract.endTime().then(async (edTime) => {
        setRemainTime(Math.max((edTime.toNumber() * 1000 - Date.now()) / 1000, 0))
      })

      if (walletAddress) {
        buyContract.getClaimableReward(walletAddress).then(claimableRes => setClaimableAmount(claimableRes[0].toString()))
        buyContract.getUserTickets(walletAddress).then(newTicketCount => SetTicketCountByUser(newTicketCount.toString()))
        buyContract.getClaimableReward(walletAddress).then(claimableRes => setClaimable(claimableRes[1].toString() !== '0'))
      }
    }, [walletAddress, buyContract])

  useInterval(() => {
    if (!buyContract)
      return;

    buyContract.lotteryStatus().then((newStatus) => setTicketStatus(newStatus))

    if (remainTime > 0) {
      setRemainTime(remainTime - 1)
      let day = `${Math.floor(remainTime / 86400)}`
      let hour = `${Math.floor((remainTime % 86400) / 3600)}`
      if (hour.length === 1) {
        hour = `0${hour}`
      }
      let minute = `${Math.floor(remainTime % 3600 / 60)}`
      if (minute.length === 1) {
        minute = `0${minute}`
      }
      let second = `${Math.floor(remainTime % 60)}`
      if (second.length === 1) {
        second = `0${second}`
      }
      if (day > 0) {
        setTimeStr(`${day} days ${hour} hours `)
      } else if (hour > 0) {
        setTimeStr(`${hour} hours ${minute} minutes ${second} seconds`)
      } else if (minute > 0) {
        setTimeStr(`${minute} minutes ${second} seconds`)
      } else if (second > 0) {
        setTimeStr(`${second} seconds`)
      } else {
        setTimeStr('Entries Closed')
      }
    } else {
      setTimeStr('')
    }
  }, 1000)

  return (
    <>
      {
        isLoading ?
          <div id="preloader"></div> :
          <div id="preloader" style={{ display: "none" }}></div>
      }
      <div className={styles.Redeempage} >
        <div className={styles.Redeem_top} />
        {/* <div>{claimableAmount}</div>
        <div>{isClaimable ? 'true' : 'false'}</div> */}
        {
          !walletAddress &&
          <div className={styles.Redeem_control}>
            <img className={styles.Redeem_img} src='images/disconnectWallet.png' />
            <div className={styles.Redeem_bottom}>
              <p className={styles.Redeem_title}>Whoops, no wallet connected</p>
              <p className={styles.Redeem_context}>
                You can connect your wallet by clicking the &quot;Connect Wallet&quot;
              </p>
            </div>
          </div>
        }
        {
          walletAddress && ticketStatus == STATUS.pending && isClaimable &&
          <div className={styles.Redeem_control}>
            <img className={styles.Redeem_img} src='images/win_ticket.png' />
            <div className={styles.Redeem_bottom}>
              {/* <p className={styles.Redeem_title} >Woohoo!</p> */}
              {
                firstPotWinner.toLowerCase() === walletAddress.toLowerCase() ? <><p className={styles.Redeem_title}>You hit the JACKPOT!<br /> </p><p className={styles.Redeem_text}>You won {(new BigNumber(claimableAmount)).div((new BigNumber(10)).pow(18)).toFixed(2)} CRO</p></>
                  : <p className={styles.Redeem_title} >You won {(new BigNumber(claimableAmount)).div((new BigNumber(10)).pow(18)).toFixed(2)} CRO</p>
              }
              {/* {
                (claimableAmount !== '' && claimableAmount !== '0') ? <p className={styles.Redeem_title} >You won {(new BigNumber(claimableAmount)).div((new BigNumber(10)).pow(18)).toFixed(2)}CRO</p> : ''
              } */}
              {/*<p className={styles.Redeem_context} >Forever Claimable</p> */}
              <div className={styles.Redeem_RedeemBtnGroup}>
                <div className={styles.Redeem_RedeemBtn} onClick={handleClaimWinnings}>
                  Claim your winnings
                </div>
              </div>
            </div>
          </div>
        }
        {
          walletAddress && ticketStatus == STATUS.pending && !isClaimable &&
          <div className={styles.Redeem_control}>
            <img className={styles.Redeem_img} src='images/no_win_ticket.png' />
            <div className={styles.Redeem_bottom}>
              <p className={styles.Redeem_title}>You have no winnings to claim.</p>
              {/* <div className={styles.Redeem_RedeemBtnGroup} >
                <div className={styles.Redeem_RedeemBtn} onClick={handleClaimWinnings}>
                  Claim your winnings
                </div>
              </div> */}
            </div>
          </div>
        }
        {
          walletAddress && ticketStatus == STATUS.open &&
          <div className={styles.Redeem_control}>
            <img className={styles.Redeem_img} src='images/no_win_ticket.png' />
            <div className={styles.Redeem_bottom}>
              <p className={styles.Redeem_title} >You have {ticketCountByUser} tickets</p>
              <div className={styles.Redeem_RedeemBtnGroup}>
                <div className={styles.Redeem_playBtnGroup}>
                  <div className={styles.Redeem_sliderGroup}>
                    <Link href="/play">
                      <button className={styles.Redeem_playBtn}>
                        Buy More Tickets
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
              {!!timeStr && <div className={styles.Redeem_remainingTime}>Ticket sale ends in {timeStr}</div>}
            </div>
          </div>
        }
        {
          walletAddress && ticketStatus == STATUS.close &&
          <div className={styles.Redeem_bottom}>
            <img className={styles.Redeem_img} src='images/security.png' />
            <p className={styles.Redeem_title} style={{lineHeight: "120%", marginTop: "24px"}}>Waiting on <a target='_blank' rel="noreferrer" href='https://witnet.io/'>Witnet</a>...</p>
            <p className={styles.Redeem_context} style={{margin: 0}}>Winners are being drawn shortly</p>
          </div>
        }
      </div>
    </>
  )
}

export default Redeem