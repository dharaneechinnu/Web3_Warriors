import styled, { keyframes, css } from "styled-components"

const shimmer = keyframes`
  0% { background-position: -200% center; }
  100% { background-position: 200% center; }
`

export const Heading1 = styled.h1`
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1.1;
  margin-bottom: 1.5rem;
  background: linear-gradient(300deg, #fff, #a78bfa, #7c3aed, #4f46e5);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  ${props => css`animation: ${shimmer} 8s linear infinite;`}
  letter-spacing: -0.02em;
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
  }
`

export const Heading2 = styled.h2`
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 1.25rem;
  background: linear-gradient(135deg, #fff 30%, rgba(167, 139, 250, 0.8));
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: -0.01em;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`

export const Heading3 = styled.h3`
  font-size: 1.75rem;
  font-weight: 600;
  line-height: 1.3;
  margin-bottom: 1rem;
  color: rgba(255, 255, 255, 0.95);
  letter-spacing: -0.01em;
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`

export const Paragraph = styled.p`
  font-size: ${props => props.large ? "1.125rem" : "1rem"};
  line-height: 1.7;
  margin-bottom: 1.25rem;
  color: rgba(255, 255, 255, ${props => props.faded ? "0.7" : "0.9"});
  max-width: ${props => props.narrow ? "65ch" : "none"};
  
  @media (max-width: 768px) {
    font-size: ${props => props.large ? "1rem" : "0.9375rem"};
  }
`

export const SmallText = styled.span`
  font-size: 0.875rem;
  color: rgba(255, 255, 255, ${props => props.faded ? "0.5" : "0.7"});
  font-weight: ${props => props.bold ? "600" : "normal"};
`

export const GradientSpan = styled.span`
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 600;
`
