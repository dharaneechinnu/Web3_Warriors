"use client"

import React from "react"
import styled, { css, keyframes } from "styled-components"

const focusAnimation = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0); }
  50% { box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.1); }
  100% { box-shadow: 0 0 0 0 rgba(124, 58, 237, 0); }
`

const InputWrapper = styled.div`
  position: relative;
  width: 100%;
`

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.9);
  transition: color 0.2s ease;
`

const StyledInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  font-size: 1rem;
  line-height: 1.5;
  color: white;
  background: rgba(30, 30, 46, 0.6);
  border: 2px solid rgba(124, 58, 237, 0.2);
  border-radius: 0.75rem;
  transition: all 0.2s ease;
  outline: none;
  
  &:hover {
    border-color: rgba(124, 58, 237, 0.4);
    background: rgba(30, 30, 46, 0.8);
  }
  
  &:focus {
    border-color: rgba(124, 58, 237, 0.8);
    background: rgba(30, 30, 46, 1);
    ${props => css`animation: ${focusAnimation} 0.8s ease;`}
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  ${props => props.error && css`
    border-color: rgba(239, 68, 68, 0.6);
    
    &:hover, &:focus {
      border-color: rgba(239, 68, 68, 0.8);
    }
  `}
`

const ErrorMessage = styled.span`
  display: block;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: rgb(239, 68, 68);
  animation: fadeIn 0.2s ease;
`

const Input = ({ label, error, ...props }) => {
  const [isFocused, setIsFocused] = React.useState(false)
  const [value, setValue] = React.useState(props.value || "")

  const handleFocus = () => setIsFocused(true)
  const handleBlur = () => setIsFocused(false)
  const handleChange = (e) => {
    setValue(e.target.value)
    if (props.onChange) props.onChange(e)
  }

  const isFloating = isFocused || value

  return (
    <InputWrapper>
      {label && <Label>{label}</Label>}
      <StyledInput error={error} {...props} onFocus={handleFocus} onBlur={handleBlur} onChange={handleChange} />
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </InputWrapper>
  )
}

export default Input
