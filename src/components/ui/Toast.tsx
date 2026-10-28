import { CheckCircle, XCircle, Info } from 'lucide-react';

interface ToastProps {
  type: 'success' | 'error' | 'info';
  message: string;
}

export default function Toast({ type, message }: ToastProps) {
  const Icon = type === 'success' ? CheckCircle : type === 'error' ? XCircle : Info;

  return (
    <div className={`toast ${type}`}>
      <Icon size={20} />
      <span>{message}</span>
    </div>
  );
}
