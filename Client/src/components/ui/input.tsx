import * as React from "react"
import { Eye, EyeOff } from "lucide-react"

import { cn } from "@/lib/utils"

type InputProps = React.ComponentProps<"input"> & {
  showToggle?: boolean
  label?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, showToggle = false, label, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false)
    const isPassword = type === "password" && showToggle

    const inputElement = (
      <input
        type={isPassword ? (visible ? "text" : "password") : type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          isPassword ? "pr-10" : "",
          className
        )}
        ref={ref}
        {...props}
      />
    )

    if (!isPassword) return inputElement

    return (
      <div className="relative">
        {inputElement}
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          tabIndex={0}
          className="absolute inset-y-0 right-3 flex items-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
