# TimePicker Component

A customizable time picker component with a clock-like interface that matches your existing theme. The component provides an intuitive way to select hours and minutes with AM/PM support.

## Features

- **Clock-like Interface**: Visual clock with clickable hour and minute markers
- **12/24 Hour Format**: Supports both 12-hour (with AM/PM) and 24-hour formats
- **Step-by-Step Selection**: Hour selection first, then minutes (guided workflow)
- **Responsive Design**: Works on all screen sizes with touch-friendly interactions
- **Keyboard Accessible**: Proper focus management and navigation
- **Theme Consistent**: Matches existing blue theme and design system
- **Clear/Reset Option**: Easy way to clear selected time

## Basic Usage

```jsx
import TimePicker from './shared/components/TimePicker';

function MyComponent() {
  const [selectedTime, setSelectedTime] = useState('');

  return (
    <TimePicker
      value={selectedTime}
      onChange={setSelectedTime}
      placeholder="Select time"
      format="12" // or "24"
    />
  );
}
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | string | `''` | Current time value in HH:MM format (24-hour) |
| `onChange` | function | - | Callback function called when time changes |
| `placeholder` | string | `'Select time'` | Placeholder text when no time selected |
| `disabled` | boolean | `false` | Whether the component is disabled |
| `className` | string | `''` | Additional CSS classes for the container |
| `format` | string | `'12'` | Time format: '12' (with AM/PM) or '24' |
| `id` | string | - | ID attribute for the input |

## Time Format

The component accepts and outputs time in 24-hour format (HH:MM) regardless of the display format:

- **Input/Output**: Always 24-hour format (e.g., "14:30", "09:00")
- **Display**: Respects the format prop:
  - `format="12"`: Shows "2:30 PM", "9:00 AM"
  - `format="24"`: Shows "14:30", "09:00"

## Examples

### Basic 12-Hour Format
```jsx
<TimePicker
  value={time}
  onChange={setTime}
  placeholder="Pick a time"
  format="12"
/>
```

### 24-Hour Format
```jsx
<TimePicker
  value={time}
  onChange={setTime}
  format="24"
  placeholder="Select time (24h)"
/>
```

### Disabled State
```jsx
<TimePicker
  value={time}
  onChange={setTime}
  disabled={true}
/>
```

### With Form Integration
```jsx
<div>
  <label htmlFor="meeting-time">Meeting Time</label>
  <TimePicker
    id="meeting-time"
    value={meetingTime}
    onChange={setMeetingTime}
    placeholder="When should we meet?"
    format="12"
  />
</div>
```

## User Interaction Flow

1. **Click Input**: Opens the time picker dropdown
2. **Select Hour**: Click on hour numbers around the clock face
3. **Select Minutes**: Automatically switches to minute selection after hour
4. **Confirm**: Click "OK" button or select minute to confirm
5. **Clear**: Click X button to clear the selected time

## Clock Interface

- **Hour Mode**: Shows 1-12 (12h format) or 0-23 (24h format)
- **Minute Mode**: Shows 00, 05, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55
- **Clock Hand**: Visual indicator showing current selection
- **AM/PM Toggle**: Only visible in 12-hour format

## Styling

The component uses Tailwind CSS classes and follows your existing design system:

- **Primary Color**: Blue (#3B82F6)
- **Hover States**: Subtle blue tints
- **Focus States**: Blue ring outline
- **Disabled States**: Gray backgrounds
- **Shadow**: Consistent with other dropdowns

## Accessibility

- **Keyboard Navigation**: Tab through interactive elements
- **Focus Management**: Proper focus indicators
- **Screen Readers**: Descriptive labels and ARIA attributes
- **Touch Friendly**: Large touch targets for mobile devices

## Integration with DateTimePicker

The TimePicker is designed to work seamlessly with the DateTimePicker component:

```jsx
import DateTimePicker from './shared/components/DateTimePicker';

<DateTimePicker
  value={dateTime}
  onChange={setDateTime}
  label="Event Date & Time"
  timeFormat="12"
/>
```

## Common Patterns

### Validation
```jsx
const validateTime = (time) => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  
  // Business hours only (9 AM to 5 PM)
  return hour >= 9 && hour <= 17;
};

<TimePicker
  value={time}
  onChange={(newTime) => {
    if (validateTime(newTime)) {
      setTime(newTime);
    } else {
      alert('Please select a time during business hours');
    }
  }}
/>
```

### Time Ranges
```jsx
const [startTime, setStartTime] = useState('');
const [endTime, setEndTime] = useState('');

<div className="grid grid-cols-2 gap-4">
  <TimePicker
    value={startTime}
    onChange={setStartTime}
    placeholder="Start time"
  />
  <TimePicker
    value={endTime}
    onChange={setEndTime}
    placeholder="End time"
    disabled={!startTime}
  />
</div>
```

## Browser Support

- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest 2 versions)
- **Mobile Browsers**: iOS Safari, Android Chrome
- **Touch Devices**: Optimized for touch interactions

## Performance

- **Lightweight**: Minimal bundle size impact
- **Optimized Rendering**: Efficient re-renders with proper memoization
- **Smooth Animations**: CSS transitions for better UX
- **Memory Efficient**: Proper cleanup of event listeners

## Troubleshooting

### Common Issues

1. **Time not updating**: Ensure you're passing the onChange callback
2. **Format issues**: Remember input/output is always 24-hour format
3. **Styling conflicts**: Check for CSS specificity issues
4. **Mobile issues**: Ensure touch events are not blocked

### Debug Tips

```jsx
// Log all time changes
<TimePicker
  value={time}
  onChange={(newTime) => {
    console.log('Time selected:', newTime);
    setTime(newTime);
  }}
/>
```

---

*For additional help or feature requests, contact the development team.*