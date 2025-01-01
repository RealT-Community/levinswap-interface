import { createTheme, MantineColorsTuple } from "@mantine/core";

const pink: MantineColorsTuple = [
  "#FFF1F8",
  "#FFE4F3",
  "#FFB8E2",
  "#FF8DD1",
  "#FF62C1",
  "#FF37B0",
  "#cab0c2",
  "#cab0c2",
  "#CC006C",
  "#B3005E",
];

const purple: MantineColorsTuple = [
  "#F3E6FF",
  "#E5CCFF",
  "#C799FF",
  "#A866FF",
  "#8F33FF",
  "#7A00FF",
  "#cab0c2",
  "#5C00CC",
  "#5100B3",
  "#460099",
];

const cyan: MantineColorsTuple = [
  "#E6FFF9",
  "#CCFFF4",
  "#99FFE8",
  "#66FFDD",
  "#33FFD1",
  "#00FFC6",
  "#00E6B2",
  "#00CC9E",
  "#00B38A",
  "#009976",
];

const custom: MantineColorsTuple = [
  "#f4e6f7",
  "#e8ccef",
  "#d199df",
  "#ba66cf",
  "#a333bf",
  "#cab0c2",
  "#795d78",
  "#795d78",
  "#4d0066",
  "#330044"
];

export const theme = createTheme({
  primaryColor: "pink",
  colors: {
    pink,
    purple,
    cyan,
    custom,
  },
  primaryShade: 6,
  fontFamily: "Inter, sans-serif",
  defaultRadius: "md",
  black: "#191B1F",
  components: {
    Button: {
      defaultProps: {
        radius: "xl",
      },
      styles: {
        root: {
          backgroundImage: "none",
          border: "1px solid transparent",
          transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          position: "relative",
          overflow: "hidden",
          "&[data-variant=gradient]": {
            background: "linear-gradient(-45deg, #cab0c2, #cab0c2, #00E6B2)",
            backgroundSize: "200% 200%",
            animation: "gradient-shift 5s ease infinite",
            boxShadow: "0 4px 15px 0 rgba(202, 176, 194, 0.3)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            "&::before": {
              content: '""',
              position: "absolute",
              top: "0",
              left: "-100%",
              width: "100%",
              height: "100%",
              background:
                "linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.2), transparent)",
              transition: "all 650ms ease",
            },
            "&:hover": {
              transform: "translateY(-2px)",
              boxShadow: "0 8px 25px 0 rgba(202, 176, 194, 0.4)",
              "&::before": {
                left: "100%",
              },
            },
            "&:active": {
              transform: "translateY(0)",
              boxShadow: "0 4px 15px 0 rgba(202, 176, 194, 0.3)",
            },
          },
          "&[data-variant=subtle]": {
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(10px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            "&:hover": {
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            },
          },
        },
      },
    },
    Card: {
      defaultProps: {
        radius: "lg",
      },
      styles: {
        root: {
          backgroundColor: "rgba(15, 19, 34, 0.7)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
          "&:hover": {
            border: "1px solid rgba(255, 255, 255, 0.15)",
          },
        },
      },
    },
    Modal: {
      defaultProps: {
        radius: "lg",
        overlayProps: {
          blur: 3,
        },
      },
    },
    Paper: {
      styles: {
        root: {
          backgroundColor: "rgba(26, 31, 53, 0.7)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          transition: "all 200ms ease",
          "&:hover": {
            border: "1px solid rgba(255, 255, 255, 0.15)",
          },
        },
      },
    },
    Tabs: {
      styles: {
        tab: {
          "&[data-active]": {
            backgroundColor: "#cab0c2",
            color: "#795d78 !important",
          },
          "&[data-active][data-active]": {
            backgroundColor: "#cab0c2",
            color: "#795d78 !important",
          },
        },
      },
    },
    Switch: {
      defaultProps: {
        color: "custom",
      },
    },
  },

  other: {
    backgroundColor: "#0F1322",
    backgroundLight: "rgba(26, 31, 53, 0.7)",
    cardBackground: "rgba(26, 31, 53, 0.7)",
    textSecondary: "#9BA1B7",
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
});
