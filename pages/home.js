import { useState, useEffect } from 'react'
import Link from 'next/link'
import { providers, Contract } from 'ethers'
import useInterval from '../hooks/useInterval'
import { ContractAddress, chainConfig } from '../constants'
import abi from '../constants/abi.json'
import useMedia from '../hooks/useMedia'
import styles from '../styles/Home.module.scss'

let lotteryContract, provider

const Home = () => {
  const [expandCrowDraw, setExpandCroDraw] = useState(false)
  const [expandFollowTwitter, setExpandFollowTwitter] = useState(false)
  const [expandWon, setExpandWon] = useState(false)
  const isMobile = useMedia('(max-width: 576px)')
  const [timeStr, setTimeStr] = useState('')
  const [remainTime, setRemainTime] = useState(0)
  const [currentTicketId, setCurrentTicketId] = useState(-1)

  useEffect(() => {
    const init = async () => {
      try {
        provider = new providers.JsonRpcProvider(chainConfig.rpcUrls[0])
        lotteryContract = new Contract(
          ContractAddress,
          abi,
          provider
        );
        lotteryContract.endTime().then(endTime => { console.log('endTime', endTime.toNumber()); setRemainTime((1679120555690 - Date.now()) / 1000) })
        lotteryContract.currentTicketId().then(curId => setCurrentTicketId(curId))
      } catch (err) {
        console.log('Error getting endtime:', err)
      }
      console.log('now', Date.now())
    }
    init()
  }, [])

  useInterval(() => {
    if (remainTime > 0) {
      setRemainTime(remainTime - 1)
      let hour = `${Math.ceil(remainTime / 3600)}`
      if (hour.length === 1) {
        hour = `0${hour}`
      }
      let minute = `${Math.ceil(remainTime % 3600 / 60)}`
      if (minute.length === 1) {
        minute = `0${minute}`
      }
      let second = `${Math.ceil(remainTime % 60)}`
      if (second.length === 1) {
        second = `0${second}`
      }
      setTimeStr(`${hour}:${minute}:${second}`)
    } else {
      setTimeStr('')
    }
    // console.log('remain', timeStr);
  }, 1000)

  const tableRankingBodyLists = [
    { name: `RANK 1`, winner: `1`, amount: `10%` },
    { name: `RANK 2`, winner: isMobile ? `2%` : `2% of entrants`, amount: isMobile ? `15% of pot` : `Split 15% of pot` },
    { name: `RANK 3`, winner: isMobile ? `5%` : `5% of entrants`, amount: isMobile ? `20% of pot` : `Split 20% of pot` },
    { name: `RANK 4`, winner: isMobile ? `10%` : `10% of entrants`, amount: isMobile ? `25% of pot` : `Split 25% of pot` },
    { name: `Hearts of gold`, winner: ``, amount: `15% of pot` },
    { name: `CroDraw `, winner: ``, amount: `15% of pot` }
  ]

  return (
    <div className={styles.HomePage}>
      <div className={styles.Home_main}>
        <div className={styles.Banner_section}>
          <div className={styles.Banner_control}>
            <div className={styles.Banner_left}>
              <div className={styles.Banner_left_top}>
                <div className={styles.Home_container}>
                  <div className={styles.Home_text}>Welcome to CroDraw!<br /><div className={styles.SmartCronos}>The SMART CRONOS lottery</div></div>
                  <Link href="/play">
                    <button className={styles.playButton}>Play now!</button>
                  </Link>
                  <button className={styles.playButtonMobile}>Play now!</button>
                  <img src="/images/banner_img.png" alt='' className={styles.mobileBannerImg} width='131px' height='150px' />
                </div>
              </div>
              <div className={`${styles.Home_container} ${styles.hideMobile}`}>
                <div className={styles.Banner_left_bottom}>
                  <p className={styles.Banner_left_bottom_context}>
                    CroDraw is the first truly randomised lottery system built on the Cronos blockchain powered by Witnet Oracle.{' '}
                  </p>
                </div>
              </div>
            </div>
            <div className={styles.Banner_right}>
              <div className={styles.Banner_img}>
                <img src="/images/banner_img.png" alt='' />
              </div>
            </div>
          </div>
        </div>

        <div className={styles.Method_section}>
          <div className={styles.Home_container} style={{ marginBottom: '120px' }}>
            <div className={styles.Method_list}>
              <div className={styles.Method_item}>
                <div className={styles.Method_img}>
                  <img src="/images/method1.png" alt='' />
                  <div />
                </div>
                <p className={styles.Method_title}>How does it work?</p>
                <p className={styles.Method_context}>
                  CroDraw is a weekly lottery system built on the Cronos blockchain, with 70% of ticket sales going straight back into the prize pot!
                </p>
                <div className={styles.Method_item1}>
                  <Link href="#fairDistribution">
                    <button className={styles.findoutButton1}>Fair Distribution</button>
                  </Link>
                </div>
              </div>
              <div className={styles.Method_item}>
                <div className={styles.Method_img}>
                  <img src="/images/method2.png" alt='' />
                  <div />
                </div>
                <p className={styles.Method_title}>Giving back?</p>
                <p className={styles.Method_context}>
                  15% of ticket sales will go directly into a charity fund to support people and causes via our &apos;Hearts of Gold&apos; initiative.{' '}
                </p>
                <div className={styles.Method_item1}>
                  <Link href="#heartsOfGold">
                    <button className={styles.findoutButton1}>Hearts of Gold</button>
                  </Link>
                </div>
              </div>
              <div className={styles.Method_item}>
                <div className={styles.Method_img}>
                  <img src="/images/method3.png" alt='' />
                  <div />
                </div>
                <p className={styles.Method_title}>Are you a winner?</p>
                <p className={styles.Method_context}>
                  CroDraws will take place every Sunday at 18:00 EST, distribution is managed via smart contract and paid automatically.{' '}
                </p>
                <div className={styles.Method_item1}>
                  <Link href="/redeem">
                    <button className={styles.findoutButton1}>Redeem Winnings</button>
                  </Link>
                </div>
              </div>
            </div>
            <div className={`${styles.Method_list} ${styles.mt30}`}>
              <div className={styles.Method_item}>
                <Link href="#fairDistribution">
                  <button className={styles.findoutButton}>Fair Distribution</button>
                </Link>
              </div>
              <div className={styles.Method_item}>
                <Link href="#heartsOfGold">
                  <button className={styles.findoutButton}>Hearts of Gold</button>
                </Link>
              </div>
              <div className={styles.Method_item}>
                <Link href="/redeem">
                  <button className={styles.findoutButton}>Redeem Winnings</button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.Ranking_section} id='fairDistribution'>
          <div className={styles.Home_container}>
            <div className={styles.Ranking_control}>
              <p className={styles.Ranking_title}> CroDraw distribution</p>
              <div className={styles.Ranking_table}>
                <table>
                  <thead>
                    <tr>
                      <th className={styles.distTableHeader1}></th>
                      <th className={styles.distTableHeader}>No of winners</th>
                      <th className={styles.distTableHeader}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRankingBodyLists.map((item, idx) => (
                      <tr
                        key={idx}
                        style={{
                          background: idx % 2 !== 0 ? `transparent` : `#f2f6f8`
                        }}
                        className={idx === 0 ? styles.Ranking_first_tr : ''}
                      >
                        <td
                          className={
                            idx === 0
                              ? styles.Ranking_first_tr_td1
                              : styles.Ranking_remain_tr_td1

                          }
                        >
                          {item.name}
                        </td>
                        <td
                          className={
                            idx === 0
                              ? styles.Ranking_first_tr_td
                              : styles.Ranking_remain_tr_td
                          }
                        >
                          {item.winner}
                        </td>
                        <td
                          className={
                            idx === 0
                              ? styles.Ranking_first_tr_td
                              : styles.Ranking_remain_tr_td
                          }
                        >
                          {item.amount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className={styles.Crow}>
                <p className={styles.Ranking_context}>
                  A minimum of 101 ticket sales each week to ensure fair distribution, if this requirement is not met the draw will roll-over until it is.{' '}
                </p>
                <Link href="/play">
                  <button className={styles.CrowButton}>PLAY NOW!</button>
                </Link>
              </div>
            </div>
          </div>
        </div>


        <div className={styles.Heart_section} id='heartsOfGold' style={{ marginTop: '40px' }}>
          <div className={styles.Home_container}>
            <div className={styles.Heart_control}>
              <div className={styles.Heart_left}>
                <img src="/images/hearts.png" className={styles.MobileLogo} alt='' />
              </div>
              <div className={styles.Heart_right}>
                <p className={styles.Heart_title}>Hearts of gold</p>
                <div className={styles.Heart_right_group}>
                  <p>
                    CroDraw aims to support and raise awareness around mental health in Crypto and NFT space, with a particular focus on mens health.{' '}
                  </p>
                  <p className={styles.Nft}>
                    20% of weekly ticket sales will go directly into a charity fund to support people and causes brought forward by the community via our &apos;Hearts of Gold&apos; initiative.{' '}
                  </p>
                </div>
                <a href='/'>Nominate a heart in need</a>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.Trpz_section}>
          <div className={styles.Home_container}>
            <div className={styles.Trpz_control}>
              <div className={styles.Trpz_right}>
                <p className={styles.Trpz_title}>Get a TRPZ discount!</p>
                <p className={styles.Trpz_context}>
                  Burn 100 $TRPZ tokens per ticket purchased to receive a 10% discount.
                </p>
                <p className={styles.learn_text}>
                  To learn more about the $TRPZ token and the Troopz Community Staking Platform head over to the <span className={styles.Troopz_context}><a target="_blank" rel="noreferrer" href="https://discord.gg/trooprz ">Troopz n Friendz Discord. </a> </span>
                </p>
                <Link href="/play">
                  <button className={styles.stakeButton}>PLAY NOW</button>
                </Link>
              </div>
              <div className={styles.Trpz_left}>
                <img src="/images/trpz.png" className={styles.trpzImg1} alt='' />
              </div>

            </div>
          </div>
        </div>

        <div className={styles.RankingSectionMobile}>
          <div className={styles.Ranking_control}>
            <p className={styles.Ranking_title}> Distribution</p>
            <div className={styles.Ranking_table}>
              <table>
                <thead>
                  <tr>
                    <th className={styles.distTableHeader}></th>
                    <th className={styles.distTableHeader}>No of winners</th>
                    <th className={styles.distTableHeader}>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRankingBodyLists.map((item, idx) => (
                    <tr
                      key={idx}
                      style={{
                        background: idx % 2 !== 0 ? `transparent` : `#f2f6f8`
                      }}
                      className={idx === 0 ? styles.Ranking_first_tr : ''}
                    >
                      <td
                        className={
                          idx === 0
                            ? styles.Ranking_first_tr_td
                            : styles.Ranking_remain_tr_td
                        }
                      >
                        {item.name}
                      </td>
                      <td
                        className={
                          idx === 0
                            ? styles.Ranking_first_tr_td
                            : styles.Ranking_remain_tr_td
                        }
                      >
                        {item.winner}
                      </td>
                      <td
                        className={
                          idx === 0
                            ? styles.Ranking_first_tr_td
                            : styles.Ranking_remain_tr_td
                        }
                      >
                        {item.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>



        <div className={styles.Heart_section}>
          <div className={styles.Home_container}>
            <div className={styles.Trpz_control}>
              <div className={styles.Trpz_left}>
                <img src="/images/brother.png" className={styles.trpzImg} alt='' />
              </div>
              <div className={styles.Trpz_right}>
                <p className={styles.Heart_title}>For My Brothers</p>
                <div className={styles.Heart_right_group}>
                  <p>
                    A unique NFT collection designed by Elkay to raise awareness surrounding mens mental health in the Crypto and NFT space.
                  </p>
                  <p className={styles.Nft}>
                    NFT holders get a 10% discount on CroDraw tickets and are entered into a weekly side draw for 2.5% of the CroDraw distribution.
                  </p>
                </div>
                <a target='_blank' rel="noreferrer" href='https://discord.gg/trooprz '>Join the Discord</a>
              </div>
            </div>
          </div>
        </div>


        {/* <div className={styles.MobileSecuritySection}>
          <div className={styles.Home_container}>
            <div className={styles.Security_control}>
              <div className={styles.Security_item}>
                <p className={styles.Security_title}>A word about security</p>
              </div>
              <div className={styles.Security_img}>
                <img src="/images/security.png" className={styles.MobileSecurityImg} />
              </div>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  )
}

export default Home
