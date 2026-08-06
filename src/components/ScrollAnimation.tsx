"use client";

import { motion } from "framer-motion";

export default function ScrollAnimation({
  children,
}: {
  children: React.ReactNode;
}) {

  return (

    <motion.div

      initial={{
        opacity: 0,
        y: 50,
      }}

      whileInView={{
        opacity: 1,
        y: 0,
      }}

      viewport={{
        once: true,
        amount: 0.2,
      }}

      transition={{
        duration: 0.7,
        ease: "easeOut",
      }}

    >

      {children}

    </motion.div>

  );

}