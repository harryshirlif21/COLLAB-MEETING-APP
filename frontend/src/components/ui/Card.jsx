import React from 'react';
import { motion } from 'framer-motion';

const Card = React.forwardRef(({ 
  children, 
  className = '', 
  hover = false, 
  glass = true,
  ...props 
}, ref) => {
  const baseStyles = 'rounded-2xl p-6 transition-all duration-300';
  const glassStyles = glass ? 'glass-card' : 'bg-surface border border-white/10 shadow-lg';
  const hoverStyles = hover ? 'hover:scale-[1.02] hover:shadow-xl cursor-pointer' : '';
  
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`${baseStyles} ${glassStyles} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
});

Card.displayName = 'Card';

export default Card;
