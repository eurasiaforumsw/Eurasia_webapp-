import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import CryptoJS from 'crypto-js';

interface MemberData {
  type: 'EFSW_MEMBER';
  id: string;
  name: string;
  nameLocal: string;
  memberType: 'professional' | 'student' | 'honorary';
  avatarUrl: string;
  status: 'active' | 'inactive' | 'suspended';
  issuedAt: string;
}

interface QRGeneratorProps {
  memberData: Omit<MemberData, 'type' | 'issuedAt'>;
  logoUrl?: string;
  size?: number;
}

const SECRET_KEY = process.env.NEXT_PUBLIC_QR_SECRET_KEY || 'your-secret-key-change-in-production';

export const generateSignature = (data: MemberData): string => {
  const payload = JSON.stringify({
    id: data.id,
    name: data.name,
    memberType: data.memberType,
    status: data.status,
    issuedAt: data.issuedAt
  });
  return CryptoJS.HmacSHA256(payload, SECRET_KEY).toString();
};

export const QRCodeGenerator: React.FC<QRGeneratorProps> = ({
  memberData,
  logoUrl,
  size = 240
}) => {
  const fullData: MemberData = {
    type: 'EFSW_MEMBER',
    ...memberData,
    issuedAt: new Date().toISOString()
  };

  const signature = generateSignature(fullData);
  const qrData = JSON.stringify({ ...fullData, signature });

  return (
    <div style={{
      display: 'grid',
      placeItems: 'center',
      padding: 'var(--space-4, 1.5rem)',
      background: 'var(--surface-2, #0F131C)',
      borderRadius: 'var(--radius-3, 1rem)',
      gap: 'var(--space-3, 1rem)'
    }}>
      <div style={{
        padding: 'var(--space-3, 1rem)',
        background: '#FFFFFF',
        borderRadius: 'var(--radius-2, 0.75rem)',
        position: 'relative'
      }}>
        <QRCodeSVG
          value={qrData}
          size={size}
          level="H"
          includeMargin={true}
          imageSettings={logoUrl ? {
            src: logoUrl,
            height: size * 0.2,
            width: size * 0.2,
            excavate: true
          } : undefined}
        />
      </div>
      <div style={{
        textAlign: 'center',
        color: 'var(--text-secondary, #94A3B8)'
      }}>
        <p style={{
          fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
          margin: 0
        }}>
          {fullData.name}
        </p>
        <p style={{
          fontSize: 'clamp(0.625rem, 1.5vw, 0.75rem)',
          margin: '0.25rem 0 0',
          opacity: 0.7
        }}>
          {fullData.id}
        </p>
      </div>
    </div>
  );
};

export const verifySignature = (data: MemberData & { signature: string }): boolean => {
  const payload = JSON.stringify({
    id: data.id,
    name: data.name,
    memberType: data.memberType,
    status: data.status,
    issuedAt: data.issuedAt
  });
  const computedSignature = CryptoJS.HmacSHA256(payload, SECRET_KEY).toString();
  return computedSignature === data.signature;
};

export const isQRExpired = (issuedAt: string, expiryDays: number = 365): boolean => {
  const issued = new Date(issuedAt);
  const now = new Date();
  const daysDiff = (now.getTime() - issued.getTime()) / (1000 * 60 * 60 * 24);
  return daysDiff > expiryDays;
};
