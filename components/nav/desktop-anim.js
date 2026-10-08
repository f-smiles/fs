const transition = { duration: 1, ease: [0.76, 0, 0.24, 1] };

export const opacity = {
  initial: { opacity: 0 },
  open: { opacity: 1, transition: { duration: 0.35 } },
  closed: { opacity: 0, transition: { duration: 0.35 } },
};

export const height = {
  initial: { height: 0, y: -50, opacity: 1 },

  enter: {
    height: "auto",
    y: 0,
    opacity: 1,
    transition: {
      duration: 1.05,             
      ease: [0.22, 1, 0.36, 1],  
      delay: 0,
    },
  },

  exit: {
    height: 0,
    y: -50,
    opacity: 1,
    transition: {
      duration: 0.7,                  // quicker snap up
      ease: [0.4, 0, 1, 1],
      delay: 0.02,
    },
  },
};
export const background = {
  initial: { y: "-100%", opacity: 0 },

  open: {
    y: "0%",
    opacity: 1,
    transition: {
      duration: 1.05,
      ease: [0.22, 1, 0.36, 1],
      delay: 0.04,  
    },
  },

  closed: {
    y: "-100%",
    opacity: 1,
    transition: {
      duration: 0.7,
      ease: [0.4, 0, 1, 1],
      delay: 0,
    },
  },
};
export const sublinkVariants = {
  initial: { y: "-100%" },

  open: (i) => ({
    y: "0%",
    transition: {
      duration: 1,
      delay: 0.2 + i * 0.016,
      ease: [0.25, 1, 0.5, 1],
    },
  }),

  closed: (i) => ({
    y: "-100%",
    transition: {
      duration: 0.6,
      delay: i * 0.01,
      ease: [0.5, 0, 0.75, 0],
    },
  }),
};


export const blur = {
  initial: {
    filter: "blur(0px)",
    opacity: 1,
  },
  open: {
    filter: "blur(4px)",
    opacity: 0.6,
    transition: { duration: 0.3 },
  },
  closed: {
    filter: "blur(0px)",
    opacity: 1,
    transition: { duration: 0.3 },
  },
};

export const translate = {
  initial: {
    y: "100%",
    opacity: 0,
  },
  enter: (i) => ({
    y: 0,
    opacity: 1,
    transition: { duration: 1, ease: [0.76, 0, 0.24, 1], delay: i[0] },
  }),
  exit: (i) => ({
    y: "100%",
    opacity: 0,
    transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1], delay: i[1] },
  }),
};
