import { ChainId /*, TokenAmount */ } from '@levinswap/uniswap-sdk'
import React, { useCallback } from 'react'
import { Text } from 'rebass'

import styled from 'styled-components'

import Logo from '../../assets/svg/logo.png'
import LogoDark from '../../assets/svg/logo.png'
import { useActiveWeb3React } from '../../hooks'
import { useDarkModeManager } from '../../state/user/hooks'
import { useETHBalances /*, useAggregateUniBalance */ } from '../../state/wallet/hooks'
// import { CardNoise } from '../earn/styled'
// import { CountUp } from 'use-count-up'

import { YellowCard } from '../Card'
import Menu from '../Menu'

import Row, { RowFixed } from '../Row'
import Web3Status from '../Web3Status'
// import ClaimModal from '../claim/ClaimModal'
// import { useToggleSelfClaimModal, useShowClaimPopup } from '../../state/application/hooks'
// import { useUserHasAvailableClaim } from '../../state/claim/hooks'
// import { useUserHasSubmittedClaim } from '../../state/transactions/hooks'
// import { Dots } from '../swap/styleds'
// import Modal from '../Modal'
// import usePrevious from '../../hooks/usePrevious'
import { RampInstantSDK } from '@ramp-network/ramp-instant-sdk'

import { RowBetween } from '../Row'
import Toggle from '../Toggle_'
import { LEVIN } from './../../constants/index'
import { addTokenToMetamask } from './../../utils/AddTokenToMetamask'
import Metamask from '../../assets/images/metamask.png'

const HeaderFrame = styled.div`
  display: grid;
  grid-template-columns: 1fr 120px;
  align-items: center;
  justify-content: space-between;
  align-items: center;
  flex-direction: row;
  width: 100%;
  top: 0;
  position: relative;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 1rem;
  z-index: 2;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    grid-template-columns: 1fr;
    padding: 0 1rem;
    width: calc(100%);
    position: relative;
  `};

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
        padding: 0.5rem 1rem;
  `}
`

const HeaderControls = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-self: flex-end;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: row;
    justify-content: space-between;
    justify-self: center;
    width: 100%;
    max-width: 960px;
    padding: 1rem;
    position: fixed;
    bottom: 0px;
    left: 0px;
    width: 100%;
    z-index: 99;
    height: 72px;
    border-radius: 5px;
    background-color: ${({ theme }) => theme.bg1};
  `};
`

const HeaderElement = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;

  ${({ theme }) => theme.mediaWidth.upToMedium`
   flex-direction: row-reverse;
    align-items: center;
  `};
`

const HeaderElementWrap = styled.div`
  display: flex;
  align-items: center;
`

const HeaderRow = styled(RowFixed)`
  ${({ theme }) => theme.mediaWidth.upToMedium`
   width: 100%;
  `};
`

const HeaderLinks = styled(Row)`
  justify-content: center;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    padding: 1rem 0 1rem 1rem;
    justify-content: flex-end;
`};
`

const AccountElement = styled.div<{ active: boolean }>`
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme, active }) => (!active ? theme.bg1 : theme.bg3)};
  border-radius: 5px;
  white-space: nowrap;
  width: 100%;
  cursor: pointer;

  :focus {
    border: 1px solid blue;
  }
`

const Ramp = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme }) => theme.primary6};
  color: ${({ theme }) => theme.primary2};
  border: solid 1px transparent
  padding: 8px 12px;
  border-radius: 5px;  
  white-space: nowrap;
  width: 100%;
  cursor: pointer;
  font-weight: 500;
  transition: 0.05s ease;

  :hover {
    border: 1px solid #463e53;
  }
`

const LevinToken = styled.div` 
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: ${({ theme }) => theme.primary6};
  color: ${({ theme }) => theme.primary2};
  border: solid 1px transparent
  padding: 8px 12px;
  border-radius: 5px;  
  white-space: nowrap;
  width: 100%;
  cursor: pointer;
  font-weight: 500;
  transition: 0.05s ease;

  :hover {
    cursor: pointer;
    border: 1px solid #463e53;
  }
`

// const UNIAmount = styled(AccountElement)`
//   color: white;
//   padding: 4px 8px;
//   height: 36px;
//   font-weight: 500;
//   background-color: ${({ theme }) => theme.bg3};
//   background: radial-gradient(174.47% 188.91% at 1.84% 0%, #ff007a 0%, #2172e5 100%), #edeef2;
// `

// const UNIWrapper = styled.span`
//   width: fit-content;
//   position: relative;
//   cursor: pointer;

//   :hover {
//     opacity: 0.8;
//   }

//   :active {
//     opacity: 0.9;
//   }
// `

const HideSmall = styled.span`
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none;
  `};
`

const NetworkCard = styled(YellowCard)`
  border-radius: 5px;
  padding: 9px 12px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    margin: 0;
    margin-right: 0.5rem;
    width: initial;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 1;
    cursor: pointer;
  `};
`

const BalanceText = styled(Text)`
  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    display: none;
  `};
`

const Title = styled.a`
  display: flex;
  align-items: center;
  pointer-events: auto;
  justify-self: flex-start;
  margin-right: 12px;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    justify-self: center;
  `};
  :hover {
    cursor: pointer;
  }
`

const UniIcon = styled.div`
  transition: transform 0.3s ease;
  :hover {
    transform: rotate(-5deg);
  }
`

const NETWORK_LABELS: { [chainId in ChainId]?: string } = {
  [ChainId.RINKEBY]: 'Rinkeby',
  [ChainId.ROPSTEN]: 'Ropsten',
  [ChainId.GÖRLI]: 'Görli',
  [ChainId.XDAI]: 'xDai'
}

export default function Header() {
  const { account, chainId } = useActiveWeb3React()

  const userEthBalance = useETHBalances(account ? [account] : [])?.[account ?? '']
  const [isDark] = useDarkModeManager()

  const { ethereum } = window
  const handleAddLvn = useCallback(() => addTokenToMetamask(ethereum, LEVIN), [ethereum])

  const startRamp = () => {
    new RampInstantSDK({
      hostAppName: 'Levinswap',
      hostLogoUrl: 'https://ipfs.io/ipfs/QmVEppJVho5LbRRkX375DNxjUtnw2pjZqTNbpKypLwRipu?filename=512x512.png',
      swapAsset: 'XDAI',
      hostApiKey: 'vqr2vvudpondpce26c7mye27ge6b67v29ezn3fxt',
      variant: 'auto'
    })
      .on('*', event => console.log(event))
      .show()
  }

  // const toggleClaimModal = useToggleSelfClaimModal()

  // const availableClaim: boolean = useUserHasAvailableClaim(account)

  // const { claimTxn } = useUserHasSubmittedClaim(account ?? undefined)

  // const aggregateBalance: TokenAmount | undefined = useAggregateUniBalance()

  // const showClaimPopup = useShowClaimPopup()

  // const countUpValue = aggregateBalance?.toFixed(0) ?? '0'
  // const countUpValuePrevious = usePrevious(countUpValue) ?? '0'
  const [darkMode, toggleDarkMode] = useDarkModeManager()
  return (
    <HeaderFrame>
      {/* <ClaimModal /> */}
      {/* <Modal isOpen={showUniBalanceModal} onDismiss={() => setShowUniBalanceModal(false)}>
        <UniBalanceContent setShowUniBalanceModal={setShowUniBalanceModal} />
      </Modal> */}
      <HeaderRow>
        <Title href=".">
          <UniIcon>
            <img width={'36px'} src={isDark ? LogoDark : Logo} alt="logo" />
          </UniIcon>
        </Title>
        <HeaderLinks>
          {/* <StyledNavLink id={`stake-nav-link`} to={'/uni'}>
            UNI
          </StyledNavLink> */}
          {/* <StyledNavLink id={`stake-nav-link`} to={'/vote'}>
            Vote
          </StyledNavLink> */}
        </HeaderLinks>
      </HeaderRow>
      <HeaderControls>
        <HeaderElement>
          <HideSmall>
            {chainId && NETWORK_LABELS[chainId] && (
              <NetworkCard title={NETWORK_LABELS[chainId]}>{NETWORK_LABELS[chainId]}</NetworkCard>
            )}
          </HideSmall>
          <LevinToken onClick={() => window.open('https://farm.levinswap.realt.community', '_blank')}>
            <span role="img" aria-label="farm">
              🌾
            </span>{' '}
            Farm
          </LevinToken>
          <LevinToken onClick={() => window.open('https://stake.levinswap.realt.community', '_blank')}>
            <span role="img" aria-label="stake">
              🍸
            </span>{' '}
            Stake
          </LevinToken>
          <LevinToken onClick={handleAddLvn}>
            <img src={Metamask} alt="Metamask" style={{ width: '20px', height: '20px', marginRight: '10px' }} /> Levin
          </LevinToken>
          <Ramp id={'ramp_btn'} onClick={startRamp}>
            Buy xDai
          </Ramp>
          {/* {availableClaim && !showClaimPopup && (
            <UNIWrapper onClick={toggleClaimModal}>
              <UNIAmount active={!!account && !availableClaim} style={{ pointerEvents: 'auto' }}>
                <TYPE.white padding="0 2px">
                  {claimTxn && !claimTxn?.receipt ? <Dots>Claiming UNI</Dots> : 'Claim UNI'}
                </TYPE.white>
              </UNIAmount>
              <CardNoise />
            </UNIWrapper>
          )} */}
          {/* {!availableClaim && aggregateBalance && (
            <UNIWrapper onClick={() => setShowUniBalanceModal(true)}>
              <UNIAmount active={!!account && !availableClaim} style={{ pointerEvents: 'auto' }}>
                {account && (
                  <HideSmall>
                    <TYPE.white
                      style={{
                        paddingRight: '.4rem'
                      }}
                    >
                      <CountUp
                        key={countUpValue}
                        isCounting
                        start={parseFloat(countUpValuePrevious)}
                        end={parseFloat(countUpValue)}
                        thousandsSeparator={','}
                        duration={1}
                      />
                    </TYPE.white>
                  </HideSmall>
                )}
                UNI
              </UNIAmount>
              <CardNoise />
            </UNIWrapper>
          )} */}
          <AccountElement active={!!account} style={{ pointerEvents: 'auto' }}>
            {account && userEthBalance ? (
              <BalanceText style={{ flexShrink: 0 }} pl="0.75rem" pr="0.5rem" fontWeight={500}>
                {userEthBalance?.toSignificant(4)} {chainId === 100 ? 'XDAI' : 'ETH'}
              </BalanceText>
            ) : null}
            <Web3Status />
          </AccountElement>
        </HeaderElement>
        <RowBetween>
          <Toggle isActive={darkMode} toggle={toggleDarkMode} />
        </RowBetween>
        <HeaderElementWrap>
          <Menu />
        </HeaderElementWrap>
      </HeaderControls>
    </HeaderFrame>
  )
}
