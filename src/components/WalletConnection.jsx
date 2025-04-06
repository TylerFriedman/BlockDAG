import React, { useState } from 'react';
import styled from 'styled-components';

const WalletContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const ConnectButton = styled.button`
  background-color: #4361ee;
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 20px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #3a56d4;
  }
`;

const WalletInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
`;

const Address = styled.div`
  font-size: 14px;
  color: #e2e2e2;
`;

const Balance = styled.div`
  font-weight: bold;
  color: #06d6a0;
`;

const WalletConnection = ({ account, playerBalance, onConnect }) => {
  // Format the account address for display (0x1234...5678)
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <WalletContainer>
      {account ? (
        <WalletInfo>
          <Address>{formatAddress(account)}</Address>
          <Balance>{parseFloat(playerBalance).toFixed(2)} BDAG</Balance>
        </WalletInfo>
      ) : (
        <ConnectButton onClick={onConnect}>Connect Wallet</ConnectButton>
      )}
    </WalletContainer>
  );
};

export default WalletConnection;