'use client'
import { useEffect } from "react";

const Loader = () => {
  useEffect(() => {
    const styleSheet = document.styleSheets[0];
    const keyframes = `
      @keyframes flash {
        0% {
          background-color: #FFF2;
          box-shadow: 80px 0 #FFF2, -80px 0 #2656F6;
        }
        50% {
          background-color: #2656F6;
          box-shadow: 80px 0 #FFF2, -80px 0 #FFF2;
        }
        100% {
          background-color: #FFF2;
          box-shadow: 80px 0 #2656F6, -80px 0 #FFF2;
        }
      }
    `;
    const index = styleSheet.insertRule(keyframes, styleSheet.cssRules.length);

    return () => {
      styleSheet.deleteRule(index);
    };
  }, []);

  return (
    <span
      style={{
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        backgroundColor: "#fff",
        boxShadow: "80px 0 #fff, -80px 0 #fff",
        position: "relative",
        animation: "flash 0.5s ease-out infinite alternate",
      }}
    />
  );
};

export default Loader;
