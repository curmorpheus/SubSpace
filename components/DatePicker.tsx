"use client";

import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker as MUIDatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import dayjs, { Dayjs } from 'dayjs';

interface DatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  label: string;
  required?: boolean;
}

const theme = createTheme({
  palette: {
    primary: {
      main: '#f97316', // orange-500
      dark: '#ea580c', // orange-600
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
              borderColor: '#f97316',
              borderWidth: '2px',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#f97316',
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

export default function DatePicker({ value, onChange, label, required = false }: DatePickerProps) {
  const handleChange = (newValue: Dayjs | null) => {
    if (newValue && newValue.isValid()) {
      // Convert to YYYY-MM-DD format
      onChange(newValue.format('YYYY-MM-DD'));
    } else if (newValue === null) {
      // When cleared, set to empty string
      onChange('');
    }
  };

  // Convert string to Dayjs object
  const dayjsValue = value ? dayjs(value) : dayjs();

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <MUIDatePicker
            value={dayjsValue}
            onChange={handleChange}
            format="MM/DD/YYYY"
            slotProps={{
              textField: {
                fullWidth: true,
                placeholder: "Select date",
                InputProps: {
                  sx: {
                    borderWidth: 2,
                    borderColor: '#e5e7eb',
                  }
                }
              },
              actionBar: {
                actions: ['today', 'clear', 'accept'],
              },
            }}
          />
        </LocalizationProvider>
      </ThemeProvider>
    </div>
  );
}
