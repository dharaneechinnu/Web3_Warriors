import styled, { keyframes, css } from "styled-components"

const pulse = keyframes`
  0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(124, 58, 237, 0.4); }
  70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(124, 58, 237, 0); }
  100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(124, 58, 237, 0); }
`

const shine = keyframes`
  0% { background-position: 200% center; }
  100% { background-position: -200% center; }
`

const Button = styled.button`
  position: relative;
  padding: 0.875rem 1.75rem;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: 0.025em;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  overflow: hidden;
  
  ${props => {
    if (props.variant === 'primary') {
      return css`
        background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%);
        color: white;
        border: none;
        
        &:before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 200%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255, 255, 255, 0.2) 25%,
            rgba(255, 255, 255, 0.2) 50%,
            transparent 100%
          );
          ${props.shine && css`animation: ${shine} 3s linear infinite;`}
        }
        
        &:hover {
          transform: translateY(-2px);
          background: linear-gradient(135deg, #6d28d9 0%, #4338ca 100%);
          box-shadow: 
            0 10px 20px -10px rgba(124, 58, 237, 0.5),
            0 4px 6px -2px rgba(124, 58, 237, 0.3);
        }
        
        &:active {
          transform: translateY(0);
        }
      `
    }
    
    if (props.variant === 'secondary') {
      return css`
        background: transparent;
        color: #7c3aed;
        border: 2px solid #7c3aed;
        
        &:hover {
          background: rgba(124, 58, 237, 0.1);
          transform: translateY(-2px);
          box-shadow: 
            0 8px 16px -6px rgba(124, 58, 237, 0.3),
            0 4px 6px -2px rgba(124, 58, 237, 0.2);
        }
        
        &:active {
          transform: translateY(0);
        }
      `
    }
    
    if (props.variant === 'outline') {
      return css`
        background: transparent;
        color: white;
        border: 2px solid rgba(255, 255, 255, 0.2);
        
        &:hover {
          border-color: rgba(255, 255, 255, 0.4);
          transform: translateY(-2px);
          box-shadow: 0 6px 12px -4px rgba(0, 0, 0, 0.2);
        }
        
        &:active {
          transform: translateY(0);
        }
      `
    }
    
    return css`
      background: rgba(124, 58, 237, 0.1);
      color: #7c3aed;
      border: none;
      
      &:hover {
        background: rgba(124, 58, 237, 0.15);
        transform: translateY(-2px);
      }
      
      &:active {
        transform: translateY(0);
      }
    `
  }}
  
  ${props => props.pulse && css`
    &:hover {
      animation: ${pulse} 1.5s infinite;
    }
  `}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }
  
  ${props => props.fullWidth && css`
    width: 100%;
  `}
  
  ${props => props.size === 'small' && css`
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    border-radius: 0.5rem;
  `}
  
  ${props => props.size === 'large' && css`
    padding: 1rem 2rem;
    font-size: 1.125rem;
    border-radius: 1rem;
  `}
`

export default Button
