//  These colors are used throughout the new UI components

export const colors = {
  static: {
    white: "#FFFFFF", // static-white
    black: "#0C0A08", // static-black
  },

  neutral: {
    25: "#FDFCFC", // neutral/25
    50: "#F8F7F7", // neutral/50
    100: "#F3F2F2", // neutral/100
    200: "#ECEAE9", // neutral/200
    300: "#D5D3D2", // neutral/300
    400: "#A6A3A0", // neutral/400
    500: "#7E7977", // neutral/500
    600: "#545251", // neutral/600
    700: "#433F3D", // neutral/700
    800: "#2A2623", // neutral/800
    900: "#1D1916", // neutral/900
    950: "#181411", // neutral/950
  },

  primary: {
    25: "#FFF8F5", // primary/25
    50: "#FFF2EB", // primary/50
    100: "#FFE6D6", // primary/100
    200: "#FFD9C2", // primary/200
    300: "#FFBF99", // primary/300
    400: "#FFA36D", // primary/400
    500: "#FF7700", // primary/500
    600: "#DE6700", // primary/600
    700: "#BE5700", // primary/700
    800: "#803800", // primary/800
    900: "#632A00", // primary/900
    950: "#481C00", // primary/950
  },

  // Brand Colors (mapped from primary for backward compatibility)
  brand: {
    primary: "#FF7700", // primary/500
    orange: {
      500: "#FF7700", // primary/500
    },
  },

  // Text Colors (mapped from neutral scale for semantic use)
  text: {
    strong: {
      950: "#181411", // neutral/950
      900: "#1D1916", // neutral/900
    },
    sub: {
      600: "#545251", // neutral/600
      500: "#7E7977", // neutral/500
    },
    soft: {
      400: "#A6A3A0", // neutral/400
    },
  },

  // Icon Colors (mapped from neutral scale for semantic use)
  icon: {
    strong: {
      950: "#181411", // neutral/950
      900: "#1D1916", // neutral/900
    },
    sub: {
      600: "#545251", // neutral/600
      500: "#7E7977", // neutral/500
    },
    soft: {
      400: "#A6A3A0", // neutral/400
    },
  },

  // Background Colors (mapped from neutral scale for semantic use)
  bg: {
    white: "#FFFFFF", // static/static-white
    weaker: {
      25: "#FDFCFC", // neutral/25
    },
    weak: {
      50: "#F8F7F7", // neutral/50
    },
    soft: {
      200: "#ECEAE9", // neutral/200
    },
    strong: {
      950: "#181411", // neutral/950
      900: "#1D1916", // neutral/900
    },
    surface: {
      800: "#2A2623", // neutral/800
    },
  },

  // Stroke/Border Colors (mapped from neutral scale for semantic use)
  stroke: {
    soft: {
      200: "#ECEAE9", // neutral/200
    },
    sub: {
      300: "#D5D3D2", // neutral/300
    },
  },
} as const;

// Type exports
export type ColorToken = typeof colors;
