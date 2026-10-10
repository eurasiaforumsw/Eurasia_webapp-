import React from 'react';
import '@/styles/button-bubble-effect.css';

interface BubbleButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'success' | 'warning' | 'danger';
  disabled?: boolean;
  className?: string;
}

/**
 * Animated button with bubble effect on hover
 *
 * @example
 * <BubbleButton variant="primary" onClick={handleSave}>
 *   บันทึกข้อมูล
 * </BubbleButton>
 *
 * @example
 * <BubbleButton variant="success" type="submit">
 *   ✓ ยืนยัน
 * </BubbleButton>
 */
export default function BubbleButton({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  disabled = false,
  className = '',
}: BubbleButtonProps) {
  const variantClass = variant === 'primary'
    ? ''
    : `button-bubble--${variant}`;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`button-bubble ${variantClass} ${className}`}
      style={disabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
    >
      {children}
    </button>
  );
}
