"use client"

import { motion, AnimatePresence } from "framer-motion"
import { ReactNode } from "react"

interface AuthTransitionProps {
  children: ReactNode
  mode: "signin" | "signup"
}

export function AuthTransition({ children, mode }: AuthTransitionProps) {
  const isSignUp = mode === "signup"
  
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={mode}
        initial={{ 
          opacity: 0,
          height: isSignUp ? "400px" : "600px",
          width: isSignUp ? "350px" : "450px",
          borderRadius: "50%",
          scale: 0.3,
          filter: "blur(10px)"
        }}
        animate={{ 
          opacity: 1,
          height: isSignUp ? "680px" : "580px",
          width: "448px",
          borderRadius: "12px",
          scale: 1,
          filter: "blur(0px)"
        }}
        exit={{ 
          opacity: 0,
          height: isSignUp ? "600px" : "400px",
          width: isSignUp ? "450px" : "350px",
          borderRadius: "50%",
          scale: 0.3,
          filter: "blur(10px)"
        }}
        transition={{
          duration: 0.7,
          ease: [0.34, 1.56, 0.64, 1],
          layout: { duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }
        }}
        layout
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
