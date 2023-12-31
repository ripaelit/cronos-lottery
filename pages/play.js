import { useState, useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import Countdown from 'react-countdown'
import { ethers, providers, Contract } from 'ethers'
import { toast } from 'react-toastify'
import BigNumber from 'bignumber.js'
import Link from 'next/link'
import { chainConfig, ContractAddress } from '../constants/index'
import ERC721ABI from '../constants/erc721Abi.json'
import { accountChanged } from '../globalState/user'
import useInterval from '../hooks/useInterval'

import styles from '../styles/Play.module.scss'
import { BakeryDiningRounded, SettingsBluetoothRounded } from '@mui/icons-material'

const renderer = ({ days, hours, minutes, seconds, completed }) => {
  if (completed) {
    return <div>Closed</div>
  } else {
    return <div>Get your tickets before {days > 0 ? <>{days} Days {hours} Hours</> : <>{hours} Hours {minutes} Minutes {seconds} Seconds</>}</div>
  }
}

const Play = () => {
  const [isLoading, setLoading] = useState(false)
  // const [playContent, setPlayContent] = useState(0)
  const [ticketPrice, setTicketPrice] = useState('0')
  const [discountTokenPrice, setDiscountTokenPrice] = useState(0)
  const [discountTokenkDecimals, setDiscountTokenDecimals] = useState(0)
  const [discountRate, setDiscountRate] = useState(0)
  const [nftDiscountRate, setNftDiscountRate] = useState(0)
  const [discountNftAddress, setDiscountNftAddress] = useState('')
  const [hasDiscountNft, setHasDiscountNft] = useState(false)
  const [ticketCountByUser, setTicketCountByUser] = useState(0)
  const [MaxTicketCount, setMaxTicketCount] = useState(0)
  const [discountTokenBlnc, setDiscountTokenBlnc] = useState('0')
  const [endTime, setEndTime] = useState(0)
  const [lotteryStatus, setLotteryStatus] = useState(0)
  const [currentTotalAmount, setCurrentTotalAmount] = useState(0)
  const [lastWinners, setLastWinners] = useState([])
  const [lastTopWinner, setLastTopWinner] = useState('')
  const [winnersByPot, setWinnerByPot] = useState([])
  const [useTrpz, setUseTrpz] = useState(false)
  const [ticketCount, setTicketCount] = useState(1)
  const [totalPrice, setTotalPrice] = useState('0')
  const [timeStr, setTimeStr] = useState('')
  const [remainTime, setRemainTime] = useState(0)
  const [isBurned, setIsBurned] = useState(false);
  const [showLivePotSizes, setShowLivePotSizes] = useState(true);
  const [winnersPot, setWinnersPot] = useState(0);
  const [charityPot, setCharityPot] = useState(0);

  const STATUS = {
    pending: 0,
    open: 1,
    close: 2,
    Claimable: 3
  }

  const walletAddress = useSelector((state) => state.user.address)
  const provider = useSelector((state) => state.user.provider)
  const walletBalance = useSelector((state) => state.user.balance)
  const buyContract = useSelector((state) => state.user.buyContract)
  const tokenContract = useSelector((state) => state.user.tokenContract)
  const dispatch = useDispatch()

  const handleBuyTicket = async () => {
    console.log("lotteryStatus = ", lotteryStatus);
    try {
      setLoading(true)
      if (!walletAddress) {
        setLoading(false)
        return toast.error('Please connect your wallet')
      }
      if (remainTime <= 0) {
        setLoading(false)
        console.log("if remainTime <= 0")
        return toast.error('Lottery has been ended')
      }
      if (lotteryStatus !== STATUS.open) {
        setLoading(false)
        return toast.error('Lottery is not open yet')
      }
      if (ticketCountByUser > MaxTicketCount) {
        setLoading(false)
        return toast.error(`You can buy Max ${MaxTicketCount} tickets`)
      }
      const getWalletBalance = new BigNumber(walletBalance).times(
        new BigNumber(10).pow(18)
      )
      const getTicketBalance = new BigNumber(ticketPrice).times(
        new BigNumber(ticketCount)
      )
      if (hasDiscountNft) {
        getTicketBalance = getTicketBalance.times(1000 - nftDiscountRate).div(1000)
      }
      if (getWalletBalance.lt(getTicketBalance)) {
        // "lt" mean A < B (lessthan)
        setLoading(false)
        return toast.error(`Insufficient Fund`)
      }

      const sendValue = await buyContract
        .calculateTotalPrice(
          ticketCount,
          false
        )
      const gasEstimated = await buyContract.estimateGas.buyTickets(
        ticketCount,
        {
          value: sendValue.toString()
        }
      )
      const gas = Math.ceil(gasEstimated.toNumber() * 1.5)
      const tx = await buyContract.buyTickets(ticketCount, {
        value: sendValue.toString(),
        gasLimit: gas
      })
      await tx.wait()

      setCurrentTotalAmount(
        Number(currentTotalAmount) + Number(ticketCount)
      )
      setTicketCountByUser(
        Number(ticketCountByUser) + Number(ticketCount)
      )
      provider
        .getBalance(walletAddress)
        .then((blnc) =>
          dispatch(accountChanged({ balance: ethers.utils.formatEther(blnc) }))
        )
      toast.success('Successfully bought tickets')
    } catch (error) {
      console.log('error', { error })
      toast.error(`Error`)
    }
    setLoading(false)
  }

  const handleDiscountBuyTicket = async () => {
    console.log("handleDiscountBuyTicket.lotteryStatus = ", lotteryStatus);
    setIsBurned(true)
    if (!walletAddress) {
      return toast.error('Please connect your wallet')
    }
    console.log({remainTime});
    if (remainTime <= 0) {
      return toast.error('Lottery has been ended')
    }
    if (lotteryStatus !== STATUS.open) {
      return toast.error('Lottery is not open yet')
    }
    if (ticketCountByUser > MaxTicketCount) {
      return toast.error(`You can buy Max ${MaxTicketCount} tickets`)
    }
    try {
      setLoading(true)

      const discountedTicketPrice = new BigNumber(ticketPrice).times(1000 - discountRate - (hasDiscountNft ? nftDiscountRate : 0)).div(1000)
      const getWalletBalance = new BigNumber(walletBalance).times(new BigNumber(10).pow(18))
      const getTicketBalance = new BigNumber(discountedTicketPrice).times(ticketCount)
      const requestTokenAmount = new BigNumber(ticketCount).times(new BigNumber(discountTokenPrice)).times(new BigNumber(10).pow(discountTokenkDecimals))

      if ((new BigNumber(discountTokenBlnc)).lt(requestTokenAmount)) {
        console.log("discountTokenBlnc", discountTokenBlnc.toString(), "requestTokenAmount", requestTokenAmount.toString())
        toast.error('Insufficient Token')
        setLoading(false)
        return
      }
      if (getWalletBalance.lt(getTicketBalance)) {
        setLoading(false)
        return toast.error(`Insufficient Fund`)
      }
      // approve only when allowance is insufficient
      const allowanceAmount = new BigNumber((await tokenContract.allowance(walletAddress, ContractAddress)).toString())
      if (allowanceAmount.lt(requestTokenAmount)) {
        let gasEstimated = await tokenContract.estimateGas.approve(
          ContractAddress,
          requestTokenAmount.toString()
        )
        let gas = Math.ceil(gasEstimated.toNumber() * 1.5)
        let tx = await tokenContract.approve(
          ContractAddress,
          requestTokenAmount.toString(),
          {
            gasLimit: gas
          }
        )
        await tx.wait()
      }

      const sendValue = await buyContract
        .calculateTotalPrice(
          ticketCount,
          true
        )
      let gasEstimated = await buyContract.estimateGas.buyDiscountTickets(
        ticketCount,
        {
          value: sendValue.toString()
        }
      )
      let gas = Math.ceil(gasEstimated.toNumber() * 1.5)
      let tx = await buyContract.buyDiscountTickets(ticketCount, {
        value: sendValue.toString(),
        gasLimit: gas
      })
      await tx.wait()

      setCurrentTotalAmount(
        Number(currentTotalAmount) + Number(ticketCount)
      )
      setTicketCountByUser(
        Number(ticketCountByUser) + Number(ticketCount)
      )

      tokenContract
        .balanceOf(walletAddress)
        .then((blnc) => setDiscountTokenBlnc(blnc.toString()))
      provider
        .getBalance(walletAddress)
        .then((blnc) =>
          dispatch(accountChanged({ balance: ethers.utils.formatEther(blnc) }))
        )
      toast.success('Successfully bought tickets')
    } catch (error) {
      console.log('error', error)
      toast.error(`Error`)
      setLoading(false)
    }
    setLoading(false)
  }

  const calculatePrice = (useDiscount, mintCnt) => {
    const rate = 1000 - (useDiscount ? discountRate : 0) - (hasDiscountNft ? nftDiscountRate : 0)
    setTotalPrice((new BigNumber(ticketPrice)).times(new BigNumber(mintCnt)).times(new BigNumber(rate)).div(1000).div((new BigNumber(10)).pow(18)).toFixed(2))
  }

  useEffect(() => {
    if (!buyContract || !provider) {
      return
    }
    console.log('balance', walletBalance);
    if (walletBalance <= 0) {
      toast.error("You don’t have enough $CRO. Reduce the number of tickets or top up your wallet!");
    }
    const init = async () => {
      buyContract.lotteryStatus().then((newStatus) => setLotteryStatus(newStatus))
      buyContract.nftContractAddress().then(newNftAddress => setDiscountNftAddress(newNftAddress))
      buyContract.nftDiscountRate().then(newRate => setNftDiscountRate(newRate.toNumber()))
      buyContract.endTime().then(async (edTime) => {
        try {
          const blockNumber = await provider.getBlockNumber()
          const timestamp = (await provider.getBlock(blockNumber)).timestamp
          console.log('current time:', { current: Date.now() / 1000, timestamp, endtime: edTime.toNumber() })
          // setRemainTime(Math.max(edTime.toNumber() - timestamp, 0))
          console.log('result', (edTime.toNumber() * 1000 - Date.now()) / 1000);
          setRemainTime(Math.max((edTime.toNumber() * 1000 - Date.now()) / 1000, 0))
        }
        catch(err) {
          console.log("error:", err)
        }
      })

      buyContract
        .ticketPrice()
        .then((newPrice) => {
          setTicketPrice(newPrice.toString())
        })
      buyContract
        .maxNumberTicketsPerBuy()
        .then((maxCount) => setMaxTicketCount(maxCount))
      buyContract
        .endTime()
        .then((newEndTime) => setEndTime(newEndTime.toString() * 1000))
      buyContract
        .currentTicketId()
        .then((newTotalAmount) =>
          setCurrentTotalAmount(newTotalAmount.toString())
        )
      buyContract
        .discountTokenPrice()
        .then((newDisPrice) => setDiscountTokenPrice(newDisPrice.toNumber()))
      buyContract
        .discountRate()
        .then((newDiscountRate) => setDiscountRate(newDiscountRate))
      buyContract.topWinner().then((newTopWinner) => {
        if (newTopWinner === '0x0000000000000000000000000000000000000000') {
          setLastTopWinner('No winners')
        } else {
          setLastTopWinner(newTopWinner)
        }
      })

      let newWinners = []
      try {
        let winner = await buyContract.getWinnersByPot(1)
        newWinners.push(winner)
        winner = await buyContract.getWinnersByPot(2)
        newWinners.push(winner)
        winner = await buyContract.getWinnersByPot(3)
        newWinners.push(winner)
        winner = await buyContract.getWinnersByPot(4)
        newWinners.push(winner)
      } catch (err) {
        console.log("error:", err)
      }
      setWinnerByPot([...newWinners])
      // const potNumber = 1
      // buyContract.getWinnersByPot(potNumber).then((winByPot) => {
      //   if (winByPot.length === 0) {
      //     setWinnerByPot('No winners\n No winners')
      //   } else {
      //     setWinnerByPot(winByPot)
      //   }
      // })
      console.log('tokencontract:', tokenContract)

      tokenContract
        .decimals()
        .then((distokenDcml) => setDiscountTokenDecimals(distokenDcml))

      if (walletAddress) {
        buyContract
          .getUserTickets(walletAddress)
          .then((ticketCount) => setTicketCountByUser(ticketCount?.toString()))

        buyContract.getLastWinners().then((lwinners) => {
          const newWinners = lwinners.filter(
            (item) => item !== '0x0000000000000000000000000000000000000000'
          )
          setLastWinners([...newWinners])
        })

        tokenContract
          .balanceOf(walletAddress)
          .then((blnc) => setDiscountTokenBlnc(blnc.toString()))
      }
    }
    init()
  }, [walletAddress, buyContract])

  useEffect(() => {
    if (!walletAddress || !discountNftAddress || !nftDiscountRate) {
      return
    }
    const readProvider = new providers.JsonRpcProvider(chainConfig.rpcUrls[0])
    if (discountNftAddress.toLowerCase() === '0x0000000000000000000000000000000000000000') {
      return
    }
    const nftContract = new Contract(
      discountNftAddress,
      ERC721ABI,
      readProvider
    )
    nftContract.balanceOf(walletAddress).then(newBlnc => setHasDiscountNft(newBlnc.toNumber() > 0))
  }, [walletAddress, discountNftAddress, nftDiscountRate])

  useEffect(() => {
    calculatePrice(useTrpz, ticketCount)
  }, [ticketPrice, hasDiscountNft])

  useInterval(() => {
    if (!buyContract)
      return;

    buyContract.lotteryStatus().then((newStatus) => setLotteryStatus(newStatus))
    buyContract.amountCollected().then(
      (newAmountCollected) => {
        // console.log("newAmountCollected", newAmountCollected, typeof(newAmountCollected))
        const totalPot = newAmountCollected / (10 ** 18)
        setWinnersPot((totalPot * 70 / 100).toFixed(2))
        setCharityPot((totalPot * 15 / 100).toFixed(2))
      }
    )

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
      {isLoading ? (
        <div id="preloader"></div>
      ) : ''}
      <div className={styles.Playpage}>
        <div className={styles.Play_top} />
        {walletAddress ? <div className={styles.Play_control}>
          {
            lotteryStatus == STATUS.open ?
              <div>
                <img
                  className={styles.Play_img}
                  src="images/play_connectedwallet.png"
                />
                <div className={styles.Play_bottom}>
                  <p className={styles.Play_title}>Buy your ticket now!</p>
                  <p className={styles.Play_price}>{new BigNumber(ticketPrice).times(new BigNumber(1000 - (useTrpz ? discountRate : 0) - (hasDiscountNft ? nftDiscountRate : 0))).div(1000).div(new BigNumber(10).pow(18)).toFixed(2)} CRO</p>
                  <div className={styles.Play_countPanel}>
                    <div className={styles.Play_countChangeButton} onClick={() => {
                      setTicketCount(ticketCount > 1 ? ticketCount - 1 : ticketCount)
                      calculatePrice(useTrpz, ticketCount > 1 ? ticketCount - 1 : ticketCount)
                    }}>-</div>
                    <div className={styles.Play_countLabel}>{ticketCount}</div>
                    <div className={styles.Play_countChangeButton} onClick={() => {
                      setTicketCount(ticketCount < MaxTicketCount ? ticketCount + 1 : ticketCount)
                      calculatePrice(useTrpz, ticketCount < MaxTicketCount ? ticketCount + 1 : ticketCount)
                    }}>+</div>
                  </div>
                  <div className={styles.Play_trpzOption}>
                    {hasDiscountNft ? (
                      <a className={styles.Play_nftDiscount} href="https://app.ebisusbay.com/drops/for-my-brothers" target={"_blank"} rel="noopener noreferrer">10% Discount has been added for holding a For My Brothers NFT</a>
                    ) : (
                      <a className={styles.Play_nftDiscount} href="https://app.ebisusbay.com/drops/for-my-brothers" target={"_blank"} rel="noopener noreferrer">For an extra 10% discount on tickets, grab a &apos; For My Brothers &apos; NFT</a>
                    )}
                    <div className={styles.burnTrpzOption}>
                      <input
                        type='checkbox'
                        checked={useTrpz}
                        onChange={e => {
                          setUseTrpz(!useTrpz)
                          calculatePrice(!useTrpz, ticketCount)
                        }}
                        className={styles.Play_trpzCheck}
                      />
                      <label className={styles.Play_trpzLabel}>Burn {discountTokenPrice} $TRPZ tokens per ticket purchased to receive a {discountRate / 10}% discount.</label>
                    </div>
                    {/* <label className={styles.Play_trpzLabel}>To learn more about the $TRPZ token and the Troopz Community Staking platform head over to the Troopz n Friendz discord.</label>
                    <a
                      className={styles.Play_playBtn}
                      target='_blank'
                      rel="noreferrer"
                      href='/'
                    >
                      Join the Discord
                    </a> */}
                  </div>
                  <div className={styles.Play_pricePanel}>
                    {totalPrice} CRO
                  </div>
                  <div
                    className={styles.Play_playBtn}
                    onClick={() => { useTrpz ? handleDiscountBuyTicket() : handleBuyTicket() }}
                  >
                    BUY
                  </div>
                  {!!timeStr && <div className={styles.Get_ticket}>Ticket sale ends in {timeStr}</div>}
                  {showLivePotSizes && <>
                    <div className={styles.Get_ticket}>LIVE POT SIZES:</div>
                    <label className={styles.Play_trpzLabel}>WINNERS POT: {winnersPot} CRO | CHARITY POT: {charityPot} CRO</label>
                  </>}
                  {/* <div className={styles.currentInfoControl}>
                    <div className={styles.currentInfoGroup}>
                      <p className={styles.currentInfoTitle}>Total Buy Amount : </p>
                      <p className={styles.currentInfoValue}>
                        {currentTotalAmount}
                      </p>
                    </div>

                    <div className={styles.currentInfoGroup}>
                      <p className={styles.currentInfoTitle}>
                        Ticket Amount By User :{' '}
                      </p>
                      <p className={styles.currentInfoValue}>{ticketCountByUser}</p>
                    </div>

                    <div className={styles.currentInfoGroup}>
                      <p className={styles.currentInfoTitle}>Last Winners : </p>
                      <div className={styles.flexColumn}>
                        {lastWinners.length > 0 ? (
                          lastWinners.map((item, index) => (
                            <p className={styles.currentInfoValue} key={index}>
                              {item}
                            </p>
                          ))
                        ) : (
                          <p className={styles.currentInfoValue}>No winners</p>
                        )}
                      </div>
                    </div>

                    <div className={styles.currentInfoGroup}>
                      <p className={styles.currentInfoTitle}>Last Top Winner : </p>
                      <p className={styles.currentInfoValue}>{lastTopWinner}</p>
                    </div>

                    <div className={styles.currentInfoGroup}>
                      <p className={styles.currentInfoTitle}>
                        Winners by pot :{' '}
                      </p>
                      <div className={`${styles.flexColumn} ${styles.currentInfoValue}`}>
                        {
                          winnersByPot.map((winners, index) => winners.length > 0 && <>
                            <div className={styles.potName}>Pot {index + 1}</div>
                            {
                              winners.map((winner, index) => <p key={index}>{winner}</p>)
                            }
                          </>)
                        }
                      </div>
                    </div>
                  </div> */}

                </div>
              </div>
            : <div>
                <img
                  className={styles.Play_img}
                  src="images/security.png"
                />
                <div className={styles.Play_bottom}>
                  <p className={styles.Play_title}>Lottery is closed<br /></p>
                  <p className={styles.Play_text}> Next lottery will start soon...</p>
                  <div className={styles.Play_playBtn}>
                    <Link href="/redeem">
                      <button className={styles.findoutButton1}>Check your winnings!</button>
                    </Link>
                  </div>
                </div>
            </div>
          }
        </div> : <div className={styles.Play_control}>
          <img
            className={styles.Play_img}
            src="images/disconnectWallet.png"
          />
          <div className={styles.Play_bottom}>
            <p className={styles.Play_title}>Whoops, no wallet connected</p>
            <p className={styles.Play_context}>
              You can connect your wallet by clicking the &quot;Connect Wallet&quot;
            </p>
          </div>
        </div>}
      </div>
    </>
  )
}

export default Play