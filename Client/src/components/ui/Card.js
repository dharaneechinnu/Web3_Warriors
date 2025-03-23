import styled from "styled-components"

const CardWrapper = styled.div`
  background: rgba(30, 30, 46, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 1rem;
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;
  border: 1px solid rgba(124, 58, 237, 0.2);
  
  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #7c3aed, #4f46e5, #7c3aed);
    transform: scaleX(0);
    transform-origin: 0% 50%;
    transition: transform 0.5s ease;
  }
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 30px -10px rgba(0, 0, 0, 0.3);
    border-color: rgba(124, 58, 237, 0.4);
    
    &:before {
      transform: scaleX(1);
    }
  }
`

const CardContent = styled.div`
  padding: ${(props) => props.padding || "1.5rem"};
`

const Card = ({ children, padding, ...props }) => {
  return (
    <CardWrapper {...props}>
      <CardContent padding={padding}>{children}</CardContent>
    </CardWrapper>
  )
}

export default Card

