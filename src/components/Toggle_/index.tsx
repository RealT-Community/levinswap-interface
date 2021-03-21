import React from 'react'
import styled from 'styled-components'
import { ReactComponent as LightIcon } from '../../assets/images/lightmode.svg'

const StyledLightIcon = styled(LightIcon)`
  circle {
    stroke: ${({ theme }) => theme.text1};
  }
  line {
    stroke: ${({ theme }) => theme.text1};
  }
`

const StyledMenuButton = styled.button`
  width: 100%;
  height: 100%;
  border: none;
  background-color: transparent;
  margin: 0;
  padding: 0;
  height: 35px;
  background-color: ${({ theme }) => theme.bg3};

  padding: 0.15rem 0.5rem;
  border-radius: 5px;

  :hover {
    cursor: pointer;
    outline: none;
    background-color: ${({ theme }) => theme.bg4};
  }
  :focus {
    cursor: pointer;
    outline: none;
  }

  svg {
    margin-top: 2px;
  }
`

const StyledMenu = styled.div`
  margin-left: 0.5rem;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  border: none;
  text-align: left;
`

export interface ToggleProps {
  id?: string
  isActive: boolean
  toggle: () => void
}

export default function Toggle({ toggle }: ToggleProps) {
  return (
    <StyledMenu>
      <StyledMenuButton onClick={toggle}>
        <StyledLightIcon />
      </StyledMenuButton>
    </StyledMenu>
  )
}
