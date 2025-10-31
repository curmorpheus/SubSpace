"use client";

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { TimePicker as MUITimePicker } from '@mui/x-date-pickers/TimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import dayjs, { Dayjs } from 'dayjs';

interface TimePickerProps {
  value: string; // HH:mm format
  onChange: (time: string) => void;
  label: string;
  required?: boolean;
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#3b82f6', // blue-500
      dark: '#2563eb', // blue-600
    },
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '12px',
            backgroundColor: 'white',
            '&:hover fieldset': {
              borderColor: '#3b82f6',
              borderWidth: '2px',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#3b82f6',
              borderWidth: '2px',
            },
          },
          '& .MuiOutlinedInput-input': {
            padding: '14px 16px',
            fontSize: '16px',
          },
        },
      },
    },
  },
});

export default function TimePicker({ value, onChange, label, required = false }: TimePickerProps) {
  const handleChange = (newValue: Dayjs | null) => {
    if (newValue && newValue.isValid()) {
      // Convert to HH:mm format
      onChange(newValue.format('HH:mm'));
    } else if (newValue === null) {
      // When cleared, set to empty string
      onChange('');
    }
  };

  // Convert string to Dayjs object or use current time
  const dayjsValue = value ? dayjs(`2000-01-01 ${value}`) : null;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <MUITimePicker
            value={dayjsValue}
            onChange={handleChange}
            slotProps={{
              textField: {
                fullWidth: true,
                placeholder: "Select time",
                InputProps: {
                  sx: {
                    borderWidth: 2,
                    borderColor: '#e5e7eb',
                  }
                }
              },
              actionBar: {
                actions: ['clear', 'accept'],
              },
            }}
          />
        </LocalizationProvider>
      </ThemeProvider>
    </div>
  );
}
