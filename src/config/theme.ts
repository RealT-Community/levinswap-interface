import { createTheme } from "@mantine/core";

export const theme = createTheme({
  primaryColor: "pink",
  colors: {
    pink: [
      "#FFE8F3",
      "#FFD1E7",
      "#FFA8D4",
      "#FF80C1",
      "#FF57AE",
      "#FF2E9B",
      "#cab0c2", // Primary Levinswap color
      "#B3005F",
      "#800044",
      "#4D0029",
    ],
    violet: [
      "#F5E6F8",
      "#EBD1F2",
      "#D6A3E5",
      "#C275D8",
      "#AE47CB",
      "#9A1BBE",
      "#cab0c2", // Secondary Levinswap color
      "#703B77",
      "#4F2954",
      "#2E1831",
    ],
  },
  primaryShade: 6,
  defaultRadius: "md",
  fontFamily: "Inter, sans-serif",
  headings: {
    fontFamily: "Inter, sans-serif",
  },
  components: {
    Button: {
      defaultProps: {
        radius: "xl",
      },
      styles: {
        root: {
          transition: "all 0.2s ease",
        },
      },
    },
    Card: {
      defaultProps: {
        radius: "lg",
      },
    },
    Tabs: {
      styles: {
        tab: {
          "&[data-active]": {
            backgroundColor: "#cab0c2",
            color: "#795d78",
          },
        },
      },
    },
  },
});
