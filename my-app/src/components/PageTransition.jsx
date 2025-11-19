import { motion } from "framer-motion";
import { useEffect } from "react";

const pageVariants = {
  initial: { opacity: 0.3, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0.3, y: -20 }
};

export default function PageTransition({ children }) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);
  
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ 
        duration: 0.35,
        ease: [0.22, 1, 0.36, 1]
      }}
      className="min-h-screen bg-gray-50 dark:bg-gray-900"
    >
      {children}
    </motion.div>
  );
}