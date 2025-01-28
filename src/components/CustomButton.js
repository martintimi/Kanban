// CustomButton.js
import React from "react";
import Button from "@mui/material/Button";
import { useTheme } from "@mui/material/styles";

const CustomButton = ({ label, onClick, startIcon, variant = "contained", color = "primary", sx, ...props }) => {
  const theme = useTheme();

  return (
    <Button
      variant={variant}
      startIcon={startIcon || null}
      onClick={onClick}
      sx={{
        mt: 2,
        mb: 4,
        width: "170px",
        fontSize: "12px",
        color: variant === "contained" ? "white" : theme.palette[color].main,
        backgroundColor: variant === "contained" ? theme.palette[color].main : "transparent",
        borderColor: variant === "outlined" ? theme.palette[color].main : "transparent",
        "&:hover": {
          backgroundColor: variant === "contained" ? theme.palette[color].dark : "transparent",
          borderColor: variant === "outlined" ? theme.palette[color].dark : "transparent",
        },
        ...sx,
      }}
      {...props}
    >
      {label}
    </Button>
  );
};

export default CustomButton;
