import React from 'react'
import Settings from '../Settings'
import styled from 'styled-components'
import { NavLink } from 'react-router-dom'
import { darken } from 'polished'
import { useTranslation } from 'react-i18next'
import QuestionHelper from '../QuestionHelper'

const SwapMenuStyled = styled.div`
  font-weight: 500;
`

const activeClassName = 'ACTIVE'

const StyledNavLink = styled(NavLink).attrs({
  activeClassName
})`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: left;
  border-radius: 5px;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.text2};
  font-size: 1rem;
  width: fit-content;
  font-weight: 500;
  opacity: 0.85;
  transition: 0.3s ease;

  &.${activeClassName} {
    border-radius: 25px;
    font-weight: 600;
    color: ${({ theme }) => theme.text1};
  }

  :hover {
    opacity: 1;
  }
  :focus {
    color: ${({ theme }) => darken(0.1, theme.text1)};
  }
`

const StyledNavLinkLiquidity = styled(NavLink).attrs({
  activeClassName
})`
  ${({ theme }) => theme.flexRowNoWrap}
  align-items: left;
  border-radius: 5px;
  margin-left: 15px;
  outline: none;
  cursor: pointer;
  text-decoration: none;
  color: ${({ theme }) => theme.text2};
  font-size: 1rem;
  width: fit-content;
  font-weight: 500;
  opacity: 0.85;
  transition: 0.3s ease;

  &.${activeClassName} {
    border-radius: 25px;
    font-weight: 600;
    color: ${({ theme }) => theme.text1};
  }

  :hover {
    opacity: 1;
  }
  :focus {
    color: ${({ theme }) => darken(0.1, theme.text1)};
  }
`

const RowStyled = styled.div`
  display: flex;
  align-items: center;
  padding: 0px 15px 10px 15px;
  position: ;
`

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  height: 58px;
`
const SettingsStyled = styled.div`
  margin: 10px 0px;
`

export default function SwapMenu({ adding }: { adding: boolean }) {
  const { t } = useTranslation()
  return (
    <SwapMenuStyled>
      <Row>
        <RowStyled>
          <StyledNavLink id={`swap-nav-link`} to={'/swap'}>
            {t('swap')}
          </StyledNavLink>
          <StyledNavLinkLiquidity id={`swap-nav-link`} to={'/add/ETH'}>
            {t('+ Liquidity')}
          </StyledNavLinkLiquidity>
        </RowStyled>
        <RowStyled>
          <QuestionHelper
            text={adding ? 'When you swap, you pay 0.3% fee.' : 'The fee is automatically sent to Liquidity Providers'}
          />
        </RowStyled>
      </Row>
      <SettingsStyled>
        <Settings />
      </SettingsStyled>
    </SwapMenuStyled>
  )
}
