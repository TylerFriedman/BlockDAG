import React, { useState } from 'react';
import styled from 'styled-components';

const StatsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 24px;
  color: #f0f0f0;
`;

const BalanceContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
`;

const Balance = styled.div`
  font-size: 32px;
  font-weight: bold;
  color: #06d6a0;
`;

const ActionContainer = styled.div`
  display: flex;
  gap: 10px;
`;

const AmountInput = styled.input`
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #3a3a5a;
  background-color: #2a2a4a;
  color: #f0f0f0;
  width: 100px;
`;

const ActionButton = styled.button`
  background-color: ${props => props.variant === 'deposit' ? '#4361ee' : '#ef233c'};
  color: white;
  border: none;
  border-radius: 5px;
  padding: 10px 20px;
  cursor: pointer;
  font-weight: bold;
  transition: all 0.3s ease;
  
  &:hover {
    opacity: 0.9;
  }
`;

const WithdrawalInfo = styled.div`
  font-size: 14px;
  color: #d0d0d0;
  margin-top: 10px;
`;

const PlayerStats = ({ playerBalance, onDeposit, onWithdraw }) => {
  const [amount, setAmount] = useState(1);
  
  const handleWithdraw = () => {
    if (amount > 0) {
      onWithdraw(amount);
    }
  };
  
  return (
    <StatsContainer>
      <Title>Player Stats</Title>
      
      <BalanceContainer>
        <div>
          <div style={{ fontSize: '14px', color: '#d0d0d0' }}>Available Balance</div>
          <Balance>{parseFloat(playerBalance).toFixed(2)} BDAG</Balance>
        </div>
        
        <ActionContainer>
          <AmountInput 
            type="number" 
            min="0.1" 
            step="0.1" 
            value={amount} 
            onChange={(e) => setAmount(parseFloat(e.target.value))}
          />
          <ActionButton variant="deposit" onClick={handleDeposit}>Deposit</ActionButton>
          <ActionButton variant="withdraw" onClick={handleWithdraw}>Withdraw</ActionButton>
        </ActionContainer>
      </BalanceContainer>
      
      <WithdrawalInfo>
        Note: Daily withdrawal limit is 200 BDAG. Maximum 10 BDAG per transaction.
      </WithdrawalInfo>
    </StatsContainer>
  );
};

export default PlayerStats;