import { CheckIcon } from './Icons'

export default function Toast({ message, visible }) {
  if (!visible) return null
  return (
    <div className="toast-container">
      <div className="toast">
        <div className="toast-icon success">
          <CheckIcon />
        </div>
        <span className="toast-message">{message}</span>
      </div>
    </div>
  )
}
