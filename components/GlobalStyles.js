import { createGlobalStyle } from "styled-components";

export const GlobalStyles = createGlobalStyle`
    body {
        margin: 0;
        height: 100%;
        overflow: hidden;
    }
    * {
        box-sizing: border-box;
        font-family: Poppins, sans-serif;
    }
`;