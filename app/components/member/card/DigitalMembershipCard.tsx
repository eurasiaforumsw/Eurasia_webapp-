'use client';

import React from 'react';
import { CardFlip } from './CardFlip';
import { QRCodeGenerator } from '../qr/QRCodeGenerator';
import { AvatarDisplay } from '../avatar/AvatarDisplay';

interface Member {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  memberType: 'professional' | 'student' | 'honorary';
  status: 'active' | 'inactive' | 'suspended';
  avatarUrl?: string | null;
  joinDate: string;
}

interface DigitalMembershipCardProps {
  member: Member;
  organizationLogo?: string;
}

const memberTypeLabels = {
  professional: 'Professional Member',
  student: 'Student Member',
  honorary: 'Honorary Member'
} as const;

const statusColors = {
  active: '#10B981',
  inactive: '#6B7280',
  suspended: '#EF4444'
} as const;

export function DigitalMembershipCard({
  member,
  organizationLogo
}: DigitalMembershipCardProps) {
  const fullName = `${member.firstName} ${member.lastName}`;
  const memberSince = new Date(member.joinDate).getFullYear();

  const cardFront = {
    title: 'EFSW Member',
    logo: organizationLogo ? (
      <img
        src={organizationLogo}
        alt="EFSW Logo"
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    ) : (
      <svg viewBox="0 0 24 24" fill="none" style={{ width: '28px', height: '28px' }}>
        <path
          d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"
          fill="currentColor"
          opacity="0.2"
        />
        <path
          d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>
    ),
    content: (
      <div style={{
        display: 'grid',
        gap: 'clamp(1rem, 2vw, 1.5rem)',
        alignContent: 'center'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'clamp(0.75rem, 2vw, 1rem)'
        }}>
          <AvatarDisplay
            avatarUrl={member.avatarUrl}
            userName={fullName}
            size={64}
          />
          <div>
            <div style={{
              fontSize: 'clamp(1rem, 2.5vw, 1.25rem)',
              fontWeight: 600,
              color: '#F9FAFB',
              marginBottom: '0.25rem'
            }}>
              {fullName}
            </div>
            <div style={{
              fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
              color: 'rgba(249, 250, 251, 0.7)'
            }}>
              {member.email}
            </div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'clamp(0.75rem, 2vw, 1rem)',
          paddingTop: 'clamp(0.75rem, 2vw, 1rem)',
          borderTop: '1px solid rgba(249, 250, 251, 0.1)'
        }}>
          <div>
            <div style={{
              fontSize: 'clamp(0.625rem, 1.2vw, 0.75rem)',
              color: 'rgba(249, 250, 251, 0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.25rem'
            }}>
              Type
            </div>
            <div style={{
              fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
              color: '#F9FAFB',
              fontWeight: 500
            }}>
              {memberTypeLabels[member.memberType]}
            </div>
          </div>

          <div>
            <div style={{
              fontSize: 'clamp(0.625rem, 1.2vw, 0.75rem)',
              color: 'rgba(249, 250, 251, 0.5)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '0.25rem'
            }}>
              Status
            </div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              fontSize: 'clamp(0.75rem, 1.5vw, 0.875rem)',
              color: '#F9FAFB',
              fontWeight: 500
            }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: statusColors[member.status]
                }}
                aria-hidden="true"
              />
              {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
            </div>
          </div>
        </div>

        <div style={{
          fontSize: 'clamp(0.625rem, 1.2vw, 0.75rem)',
          color: 'rgba(249, 250, 251, 0.5)',
          textAlign: 'center',
          paddingTop: 'clamp(0.5rem, 1vw, 0.75rem)'
        }}>
          Member since {memberSince}
        </div>
      </div>
    )
  };

  const cardBack = {
    title: 'QR Code',
    content: (
      <div style={{
        display: 'grid',
        placeItems: 'center',
        height: '100%'
      }}>
        <QRCodeGenerator
          memberData={{
            id: member.id,
            name: fullName,
            nameLocal: fullName,
            memberType: member.memberType,
            avatarUrl: member.avatarUrl || '',
            status: member.status
          }}
          logoUrl={organizationLogo}
          size={200}
        />
        <div style={{
          fontSize: 'clamp(0.625rem, 1.2vw, 0.75rem)',
          color: 'rgba(249, 250, 251, 0.5)',
          textAlign: 'center',
          maxWidth: '280px',
          lineHeight: 1.5
        }}>
          Scan this QR code to verify membership status and access member benefits
        </div>
      </div>
    )
  };

  return <CardFlip front={cardFront} back={cardBack} />;
}
