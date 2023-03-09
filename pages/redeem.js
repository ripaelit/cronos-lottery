import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import Link from 'next/link'
import BigNumber from 'bignumber.js'
import { toast } from 'react-toastify';

import styles from '../styles/Redeem.module.scss'

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
  const [endTime, setEndTime] = useState(0)
  const [ticketStatus, setTicketStatus] = useState(0)
  const [firstPotWinner, setFirstPotWinner] = useState('')

  const walletAddress = useSelector(state => state.user.address);

  const buyContract = useSelector(state => state.user.buyContract);

  const handleClaimWinnings = async () => {
    try {
      setLoading(true)

      const tx = await buyContract.claimRewards();
      await tx.wait()

      setLoading(false)
      toast.success('Successfully claim ')

    } catch (error) {
      console.log('error', error)
      toast.error('Error')
      setLoading(false)
    }
  }

  useEffect(() => {
    (
      async () => {
        if (!buyContract) {
          return
        }
        buyContract.status().then(newStatus => setTicketStatus(newStatus))
        buyContract.ticketPrice().then(newPrice => setTicketPrice(newPrice.toString()))
        buyContract.maxNumberTicketsPerBuy().then(newMax => setMaxTicketCount(newMax))
        buyContract.endTime().then(newEnd => setEndTime(newEnd.toNumber() * 1000))
        buyContract.getWinnersByPot(1).then(firstPotWinners => setFirstPotWinner(firstPotWinners.length > 0 ? firstPotWinners[0] : ''))

        if (walletAddress) {
          buyContract.getClaimableReward(walletAddress).then(claimableRes => setClaimableAmount(claimableRes[0].toString()))
          buyContract.getUserTickets(walletAddress).then(newTicketCount => SetTicketCountByUser(newTicketCount.toString()))
          buyContract.getClaimableReward(walletAddress).then(newClaimCnt => setClaimable(newClaimCnt.toString() !== '0'))
        }
      }
    )()
  }, [walletAddress, buyContract])

  return (
    <>
      {
        isLoading ?
          <div id="preloader"></div> :
          <div id="preloader" style={{ display: "none" }}></div>
      }
      <div className={styles.Redeempage} >
        <div className={styles.Redeem_top} />
        {
          !walletAddress &&
          <div className={styles.Redeem_control} >
            <img className={styles.Redeem_img} src='images/disconnectWallet.png' />

            <div className={styles.Redeem_bottom} >

              <p className={styles.Redeem_title} >Whoops, no wallet connected</p>
              <p className={styles.Redeem_context} >
                You can connect your wallet by clicking the &quot;Connect Wallet&quot; button
              </p>
            </div>
          </div>
        }
        {
          walletAddress && isClaimable &&
          <div className={styles.Redeem_control} >
            <img className={styles.Redeem_img} src='images/win_ticket.png' />
            <div className={styles.Redeem_bottom} >
              <p className={styles.Redeem_title} >Woohoo!</p>

              {
                firstPotWinner === walletAddress ? <p className={styles.Redeem_context} >You won the jackpot</p> : ''
              }
              {
                (claimableAmount !== '' && claimableAmount !== '0') ? <p className={styles.Redeem_context} >You won {(new BigNumber(claimableAmount)).div((new BigNumber(10)).pow(18)).toFixed(2)}CRO</p> : ''
              }
              <p className={styles.Redeem_context} >Week Claimable</p>
              <div className={styles.Redeem_RedeemBtnGroup} >
                <div className={styles.Redeem_RedeemBtn} onClick={handleClaimWinnings}  >
                  Claim your winnings
                </div>
              </div>
            </div>
          </div>
        }
        {
          walletAddress && !isClaimable &&
          <div className={styles.Redeem_control} >
            <img className={styles.Redeem_img} src='images/no_win_ticket.png' />
            <div className={styles.Redeem_bottom} >
              <p className={styles.Redeem_title} >No winning tickets…</p>
              {
                firstPotWinner === walletAddress ? <p className={styles.Redeem_context} >You won the jackpot</p> : ''
              }
              {
                (claimableAmount !== '' && claimableAmount !== '0') ? <p className={styles.Redeem_context} >You won {(new BigNumber(claimableAmount)).div((new BigNumber(10)).pow(18)).toFixed(2)}CRO</p> : ''
              }
              <p className={styles.Redeem_context} >Week Claimable</p>
              <div className={styles.Redeem_RedeemBtnGroup} >
                <div className={styles.Redeem_playBtnGroup} >
                  <div className={styles.Redeem_sliderGroup} >
                    <Link href="/play">
                      <button className={styles.Redeem_playBtn}  >
                        PLAY NOW
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        }
      </div>
    </>
  )
}

export default Redeem