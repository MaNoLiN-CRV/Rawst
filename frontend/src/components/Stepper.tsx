import { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Stepper, 
  Step, 
  StepLabel, 
  StepContent 
} from '@mui/material';

interface StepInfo {
  label: string;
  description: string;
  content: React.ReactNode;
}

interface StepperComponentProps {
  steps: StepInfo[];
  activeStep: number;
  loading: boolean;
  handleBack: () => void;
  handleNext: () => void;
  selectedTables: string[];
}

const StepperComponent = ({
  steps,
  activeStep,
  loading,
  handleBack,
  handleNext,
  selectedTables
}: StepperComponentProps) => {
  return (
    <>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>RusterAPI</Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Transform your database into elegant RESTful APIs
        </Typography>
      </Box>
      
      <Stepper activeStep={activeStep} orientation="vertical">
        {steps.map((stepInfo, index) => (
          <Step key={index}>
            <StepLabel>
              <Typography variant="subtitle1">{stepInfo.label}</Typography>
            </StepLabel>
            <StepContent>
              <Typography color="text.secondary" sx={{ mb: 2 }}>
                {stepInfo.description}
              </Typography>
              <Box sx={{ mb: 3 }}>
                {stepInfo.content}
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2 }}>
                {index > 0 && (
                  <Button
                    variant="outlined"
                    onClick={handleBack}
                    disabled={loading}
                  >
                    Back
                  </Button>
                )}
                {index < steps.length - 1 && (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    disabled={loading || (index === 1 && selectedTables.length === 0)}
                  >
                    Next
                  </Button>
                )}
              </Box>
            </StepContent>
          </Step>
        ))}
      </Stepper>
    </>
  );
};

export default StepperComponent; 