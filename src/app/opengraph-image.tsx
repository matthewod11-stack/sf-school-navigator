import { ImageResponse } from "next/og";

export const alt = "SF School Navigator — Find the right preschool for your family";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#FAF8F5",
          padding: "60px 80px",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "24px",
          }}
        >
          <div
            style={{
              fontSize: "20px",
              fontWeight: 400,
              color: "#78716c",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            San Francisco
          </div>
          <div
            style={{
              fontSize: "64px",
              fontWeight: 700,
              color: "#1c1917",
              textAlign: "center",
              lineHeight: 1.1,
              fontFamily: "serif",
            }}
          >
            School Navigator
          </div>
          <div
            style={{
              width: "80px",
              height: "3px",
              backgroundColor: "#1c1917",
              marginTop: "8px",
              marginBottom: "8px",
            }}
          />
          <div
            style={{
              fontSize: "24px",
              fontWeight: 400,
              color: "#57534e",
              textAlign: "center",
              maxWidth: "700px",
              lineHeight: 1.5,
            }}
          >
            Find the right preschool for your family.
            Compare 500+ programs across every SF neighborhood.
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "16px",
            color: "#a8a29e",
          }}
        >
          sfschoolnavigator.com
        </div>
      </div>
    ),
    { ...size }
  );
}
