import { motion } from 'framer-motion';

export default function Logo({ size = 100 }) {
  return (
    <motion.svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      width={size}
      height={size}
      aria-label="Gamarr Logo"
      whileHover={{ scale: 1.1, rotate: 5 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      {/* Background Circle */}
      <circle cx="100" cy="100" r="90" fill="#1a1a1a" />

      {/* Stylized G */}
      <path
        d="M130 70 A40 40 0 1 0 130 130 L130 100 L100 100"
        stroke="#6366f1"
        fill="none"
        strokeWidth="12"
        strokeLinecap="round"
      />

      {/* D-Pad Inspired Elements */}
      <rect
        x="90"
        y="85"
        width="30"
        height="30"
        fill="#6366f1"
        transform="rotate(45 105 100)"
      />
    </motion.svg>
  );
}