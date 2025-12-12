import { Box, Input } from "@mui/joy";
import { useEffect, useRef, useState } from "react";

interface OTPInputProps {
  onChange: (value: string) => void;
  disabled?: boolean;
}

const OTPInput = ({ onChange, disabled }: OTPInputProps) => {
  const otpLength = 6;
  const [otp, setOtp] = useState("");
  const inputRefs = useRef<HTMLInputElement[]>([]); // Array of refs for each input field

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      !/^[0-9]{1}$/.test(e.key) &&
      e.key !== "Backspace" &&
      e.key !== "Delete" &&
      e.key !== "Tab" &&
      !e.metaKey
    ) {
      e.preventDefault();
    }

    if (e.key === "Delete" || e.key === "Backspace") {
      setOtp("");
      inputRefs.current[0].focus();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { target } = e;
    const index = inputRefs.current.indexOf(target);
    if (target.value) {
      setOtp(otp.slice(0, index) + target.value + otp.slice(index + 1));
    }
    inputRefs.current[index + 1]?.focus?.();
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text");
    if (!new RegExp(`^[0-9]{${otp.length}}$`).test(text)) {
      return;
    }
    setOtp(text);
  };

  useEffect(() => {
    onChange(otp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  return (
    <Box sx={{ display: "flex", gap: 1, justifyContent: "space-between" }}>
      {Array.from({ length: otpLength }).map((_, index) => (
        <Input
          key={index}
          type="text"
          value={otp[index] || ""}
          onKeyDown={handleKeyDown}
          onFocus={handleFocus}
          onPaste={handlePaste}
          disabled={disabled}
          sx={{
            width: "48px",
            height: "48px",
            textAlign: "center",
            fontSize: "1.5rem",
            fontWeight: "bold",
            "& input": {
              textAlign: "center",
            },
          }}
          slotProps={{
            input: {
              maxLength: 1,
              onInput: handleInput,
              ref: (el) => {
                if (el) {
                  inputRefs.current[index] = el;
                }
              },
            },
          }}
        />
      ))}
      {/* You can conditionally render a submit button here based on otp length */}
    </Box>
  );
};

export default OTPInput;
