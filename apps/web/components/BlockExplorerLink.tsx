/**
 * Block Explorer Link Components
 * Reusable components for displaying addresses and transaction hashes with links to block explorer
 */

import React from 'react';
import { getAddressUrl, getTransactionUrl, shortenAddress, shortenHash } from '@/lib/blockExplorer';

interface ExternalLinkIconProps {
  size?: number;
}

const ExternalLinkIcon: React.FC<ExternalLinkIconProps> = ({ size = 14 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ display: 'inline', marginLeft: '0.25rem', verticalAlign: 'middle' }}
  >
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
);

interface AddressLinkProps {
  address: string;
  chainId: number;
  truncate?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export const AddressLink: React.FC<AddressLinkProps> = ({
  address,
  chainId,
  truncate = false,
  style,
  className,
}) => {
  const displayAddress = truncate ? shortenAddress(address) : address;
  const url = getAddressUrl(chainId, address);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={{
        color: '#60a5fa',
        textDecoration: 'none',
        transition: 'all 0.2s',
        fontFamily: 'monospace',
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.textDecoration = 'underline';
        e.currentTarget.style.color = '#93c5fd';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.textDecoration = 'none';
        e.currentTarget.style.color = '#60a5fa';
      }}
    >
      {displayAddress}
      <ExternalLinkIcon />
    </a>
  );
};

interface TransactionLinkProps {
  hash: string;
  chainId: number;
  truncate?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export const TransactionLink: React.FC<TransactionLinkProps> = ({
  hash,
  chainId,
  truncate = true,
  style,
  className,
}) => {
  const displayHash = truncate ? shortenHash(hash) : hash;
  const url = getTransactionUrl(chainId, hash);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      style={{
        color: '#60a5fa',
        textDecoration: 'none',
        transition: 'all 0.2s',
        fontFamily: 'monospace',
        ...style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.textDecoration = 'underline';
        e.currentTarget.style.color = '#93c5fd';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.textDecoration = 'none';
        e.currentTarget.style.color = '#60a5fa';
      }}
    >
      {displayHash}
      <ExternalLinkIcon />
    </a>
  );
};

