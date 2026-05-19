import React from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

const Input = React.forwardRef(({ 
  type = 'text', 
  label, 
  error, 
  showPasswordToggle = false,
  className = '', 
  ...props 
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);
  
  const inputType = type === 'password' && showPassword ? 'text' : type;
  
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        <motion.input
          ref={ref}
          type={inputType}
          className={`w-full px-4 py-3 rounded-xl bg-surface border border-white/10 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 ${error ? 'border-danger/50 focus:ring-danger/50' : ''} ${showPasswordToggle ? 'pr-12' : ''} ${className}`}
          whileFocus={{ scale: 1.01 }}
          {...props}
        />
        {showPasswordToggle && type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 text-danger text-sm"
        >
          <AlertCircle className="w-4 h-4" />
          {error}
        </motion.div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
