import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  const branch = process.env.AWS_BRANCH || "dev";
  const isProduction = branch === "main";

  const bgColor = isProduction ? "#16a34a" : "#f59e0b";
  const letter = isProduction ? "C" : "D";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: bgColor,
          borderRadius: "6px",
          color: "white",
          fontSize: 22,
          fontWeight: 700,
        }}
      >
        {letter}
      </div>
    ),
    { ...size }
  );
}
