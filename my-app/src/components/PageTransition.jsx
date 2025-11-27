import { motion } from "framer-motion";
import { useEffect } from "react";

const pageVariants = {
  initial: { 
    opacity: 0.8,
    scale: 1,
    filter: "blur(0px)"
  },
  animate: { 
    opacity: 1,
    scale: 1,
    filter: "blur(0px)"
  },
  exit: { 
    opacity: 0.8,
    scale: 1,
    filter: "blur(0px)"
  }
};

export default function PageTransition({ children, skipTransition = false }) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);
  
  // If skipTransition is true, render without animation
  if (skipTransition) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {children}
      </div>
    );
  }
  
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ 
        duration: 0.15,
        ease: [0.16, 1, 0.3, 1]
      }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
    >
      {children}
    </motion.div>
  );
}