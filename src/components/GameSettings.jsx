import React, { useState } from 'react';
import styled from 'styled-components';

const SettingsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 24px;
  color: #f0f0f0;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-size: 14px;
  color: #d0d0d0;
`;

const Input = styled.input`
  padding: 10px;
  border-radius: 5px;
  border: 1px solid #3a3a5a;
  background-color: #2a2a4a;
  color: #f0f0f0;
  font-size: 16px;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
`;

const StartButton = styled.button`
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

const DifficultyContainer = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
`;

const DifficultyButton = styled.button`
  background-color: ${props => props.active ? '#4361ee' : '#2a2a4a'};
  color: #f0f0f0;
  border: 1px solid #3a3a5a;
  border-radius: 5px;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: ${props => props.active ? '#4361ee' : '#3a3a5a'};
  }
`;

const GameSettings = ({ settings, onUpdateSettings, onStartGame, disabled }) => {
  const [localSettings, setLocalSettings] = useState(settings);
  
  // Predefined difficulty levels
  const difficultyLevels = [
    { name: 'Easy', mines: 3, gridSize: 5 },
    { name: 'Medium', mines: 5, gridSize: 5 },
    { name: 'Hard', mines: 7, gridSize: 5 },
    { name: 'Expert', mines: 10, gridSize: 5 }
  ];
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    const newSettings = { ...localSettings, [name]: parseFloat(value) };
    setLocalSettings(newSettings);
    onUpdateSettings(newSettings);
  };
  
  const handleDifficultySelect = (difficulty) => {
    const newSettings = { 
      ...localSettings, 
      numMines: difficulty.mines,
      gridSize: difficulty.gridSize
    };
    setLocalSettings(newSettings);
    onUpdateSettings(newSettings);
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onStartGame();
  };
  
  return (
    <SettingsContainer>
      <Title>Game Settings</Title>
      
      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label>Difficulty</Label>
          <DifficultyContainer>
            {difficultyLevels.map((level) => (
              <DifficultyButton
                key={level.name}
                type="button"
                active={localSettings.numMines === level.mines}
                onClick={() => handleDifficultySelect(level)}
                disabled={disabled}
              >
                {level.name}
              </DifficultyButton>
            ))}
          </DifficultyContainer>
        </FormGroup>
        
        <FormGroup>
          <Label>Number of Mines: {localSettings.numMines}</Label>
          <Input
            type="range"
            name="numMines"
            min="1"
            max={Math.floor(localSettings.gridSize * localSettings.gridSize / 2)}
            value={localSettings.numMines}
            onChange={handleChange}
            disabled={disabled}
          />
        </FormGroup>
        
        <FormGroup>
          <Label>Bet Amount (BDAG)</Label>
          <Input
            type="number"
            name="betAmount"
            min="0.1"
            step="0.1"
            value={localSettings.betAmount}
            onChange={handleChange}
            disabled={disabled}
          />
        </FormGroup>
        
        <ButtonGroup>
          <StartButton type="submit" disabled={disabled}>
            Start Game
          </StartButton>
        </ButtonGroup>
      </Form>
    </SettingsContainer>
  );
};

export default GameSettings;