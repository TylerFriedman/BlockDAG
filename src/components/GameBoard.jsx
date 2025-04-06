import React from 'react';
import styled from 'styled-components';

const BoardContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 24px;
  color: #f0f0f0;
`;

const GameInfo = styled.div`
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 20px;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const InfoLabel = styled.div`
  font-size: 14px;
  color: #d0d0d0;
`;

const InfoValue = styled.div`
  font-size: 24px;
  font-weight: bold;
  color: ${props => props.color || '#f0f0f0'};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(${props => props.size}, 1fr);
  gap: 10px;
  margin-bottom: 20px;
`;

const Tile = styled.div`
  width: 60px;
  height: 60px;
  background-color: ${props => 
    props.revealed 
      ? (props.isMine ? '#ef233c' : (props.isGem ? '#06d6a0' : '#3a3a5a')) 
      : '#2a2a4a'
  };
  border-radius: 5px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: ${props => (props.disabled || props.revealed) ? 'default' : 'pointer'};
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${props => (props.disabled || props.revealed) ? '' : '#3a3a5a'};
    transform: ${props => (props.disabled || props.revealed) ? '' : 'scale(1.05)'};
  }
`;

const TileContent = styled.div`
  font-size: 24px;
  color: #f0f0f0;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 15px;
  margin-top: 20px;
`;

const CashoutButton = styled.button`
  background-color: #06d6a0;
  color: #1a1a2e;
  border: none;
  border-radius: 5px;
  padding: 12px 24px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #05c091;
  }
  
  &:disabled {
    background-color: #3a3a5a;
    cursor: not-allowed;
  }
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
`;

const LoadingSpinner = styled.div`
  border: 5px solid #f3f3f3;
  border-top: 5px solid #4361ee;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const GameBoard = ({ 
  tiles, 
  onRevealTile, 
  onCashout, 
  gameActive, 
  loading, 
  multiplier, 
  potentialWinnings,
  disabled
}) => {
  // Calculate grid size from the number of tiles
  const gridSize = Math.sqrt(tiles.length);
  
  return (
    <BoardContainer>
      <Title>Mines Game</Title>
      
      {gameActive && (
        <GameInfo>
          <InfoItem>
            <InfoLabel>Multiplier</InfoLabel>
            <InfoValue color="#4361ee">{multiplier.toFixed(2)}x</InfoValue>
          </InfoItem>
          
          <InfoItem>
            <InfoLabel>Potential Winnings</InfoLabel>
            <InfoValue color="#06d6a0">{potentialWinnings.toFixed(2)} BDAG</InfoValue>
          </InfoItem>
        </GameInfo>
      )}
      
      <div style={{ position: 'relative' }}>
        <Grid size={gridSize}>
          {tiles.map((tile) => (
            <Tile 
              key={tile.index}
              revealed={tile.revealed}
              isMine={tile.isMine}
              isGem={tile.isGem}
              disabled={disabled || !gameActive}
              onClick={() => !tile.revealed && gameActive && !disabled && onRevealTile(tile.index)}
            >
              <TileContent>
                {tile.revealed && (
                  tile.isMine ? '💣' : '💎'
                )}
              </TileContent>
            </Tile>
          ))}
        </Grid>
        
        {loading && (
          <LoadingOverlay>
            <LoadingSpinner />
          </LoadingOverlay>
        )}
      </div>
      
      {gameActive && (
        <ButtonContainer>
          <CashoutButton 
            onClick={onCashout}
            disabled={disabled || tiles.filter(t => t.revealed).length === 0}
          >
            Cash Out
          </CashoutButton>
        </ButtonContainer>
      )}
    </BoardContainer>
  );
};

export default GameBoard;