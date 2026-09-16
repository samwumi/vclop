# OTP Input Boxes Not Visible - Fix

## Problem
The OTP input boxes are not showing in the UI, but there's white space where they should be.

## Possible Causes
1. CSS styling making inputs invisible (white text on white background)
2. Tailwind classes not being applied correctly
3. Input height/width set to 0
4. z-index issue

## Quick Fix - Update OtpInput Component

The inputs might be rendering but not visible. Let's add explicit visibility styles.

### Option 1: Add Inline Styles (Quick Test)

Open browser DevTools (F12) on the password change page and run this in Console:

```javascript
// Make OTP inputs visible if they're hidden
document.querySelectorAll('input[inputmode="numeric"]').forEach(input => {
  input.style.width = '48px';
  input.style.height = '56px';
  input.style.fontSize = '24px';
  input.style.border = '2px solid #667eea';
  input.style.borderRadius = '8px';
  input.style.textAlign = 'center';
  input.style.backgroundColor = 'white';
  input.style.color = 'black';
  input.style.display = 'block';
});
```

If inputs appear after running this, it's a CSS issue.

### Option 2: Update Component with Explicit Styles

If Option 1 works, update the OtpInput component:

**File:** `vclop/vclop-frontend/src/components/auth/OtpInput.tsx`

Replace the input className with this more explicit version:

```typescript
className={`
  w-12 h-14 text-center text-2xl font-semibold
  border-2 rounded-lg
  transition-all duration-200
  focus:outline-none focus:ring-2 focus:ring-offset-2
  ${
    error
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
  }
  ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
  hover:border-gray-400
  !text-gray-900 !bg-white !block !visible
`}
```

The `!important` classes (`!text-gray-900`, `!bg-white`, `!block`, `!visible`) will override any conflicting styles.

### Option 3: Check if Tailwind is Working

If Tailwind classes aren't being applied, add this fallback style to the input:

```typescript
style={{
  width: '48px',
  height: '56px',
  fontSize: '24px',
  textAlign: 'center',
  border: '2px solid #e5e7eb',
  borderRadius: '8px',
  backgroundColor: 'white',
  color: '#1f2937'
}}
```

## Alternative: Use Simple Text Input

If the fancy component isn't working, replace OtpInput with a simple input:

**In ProfilePage.tsx, replace:**

```tsx
<div className="py-2">
  <OtpInput
    value={otpCode}
    onChange={(value) => {
      setOtpCode(value);
      setOtpError('');
    }}
    disabled={passwordMutation.isPending}
    error={!!otpError}
    autoFocus
  />
</div>
```

**With:**

```tsx
<div className="py-4">
  <label className="block text-sm font-medium text-gray-700 mb-2 text-center">
    Enter 6-Digit OTP Code
  </label>
  <input
    type="text"
    inputMode="numeric"
    maxLength={6}
    value={otpCode}
    onChange={(e) => {
      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
      setOtpCode(value);
      setOtpError('');
    }}
    disabled={passwordMutation.isPending}
    autoFocus
    placeholder="123456"
    className={`
      w-full max-w-xs mx-auto block
      text-center text-2xl font-mono tracking-widest
      px-4 py-3
      border-2 rounded-lg
      ${otpError ? 'border-red-500' : 'border-gray-300'}
      focus:outline-none focus:ring-2 focus:ring-blue-500
      disabled:bg-gray-100
    `}
    style={{
      letterSpacing: '0.5em',
      fontSize: '28px',
      height: '60px'
    }}
  />
</div>
```

This creates a single input field that's simple and always visible.

## Testing Steps

1. Open the Profile page
2. Scroll to Change Password
3. Fill in passwords
4. Click "Send OTP to Email"
5. The OTP input(s) should now be clearly visible

## If Still Not Working

Check browser console (F12) for:
- React errors
- CSS loading errors
- Component rendering errors

Also inspect the element where OTP inputs should be and check:
- Is the div with `py-2` class rendering?
- Are input elements in the DOM?
- What are their computed styles?
