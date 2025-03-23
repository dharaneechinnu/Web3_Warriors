import styled from "styled-components"

const BadgeWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  font-weight: 600;
  border-radius: 9999px;
  background: ${(props) => {
    switch (props.variant) {
      case "primary":
        return "linear-gradient(135deg, #7c3aed, #4f46e5)"
      case "success":
        return "linear-gradient(135deg, #10b981, #059669)"
      case "warning":
        return "linear-gradient(135deg, #f59e0b, #d97706)"
      case "danger":
        return "linear-gradient(135deg, #ef4444, #dc2626)"
      case "info":
        return "linear-gradient(135deg, #3b82f6, #2563eb)"
      default:
        return "linear-gradient(135deg, #7c3aed, #4f46e5)"
    }
  }};
  color: white;
  box-shadow: 0 2px 5px 0 rgba(0, 0, 0, 0.1);
  text-transform: uppercase;
  letter-spacing: 0.05em;
`

const Badge = ({ children, variant = "primary", ...props }) => {
  return (
    <BadgeWrapper variant={variant} {...props}>
      {children}
    </BadgeWrapper>
  )
}

export default Badge

