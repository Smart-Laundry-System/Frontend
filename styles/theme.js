import { Platform } from "react-native";

export const WEB_FONT_STACK =
    'system-ui, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';

const fonts = Platform.select({
    web: {
        regular: { fontFamily: WEB_FONT_STACK, fontWeight: "400" },
        medium: { fontFamily: WEB_FONT_STACK, fontWeight: "500" },
        bold: { fontFamily: WEB_FONT_STACK, fontWeight: "600" },
        heavy: { fontFamily: WEB_FONT_STACK, fontWeight: "700" },
    },
    ios: {
        regular: { fontFamily: "System", fontWeight: "400" },
        medium: { fontFamily: "System", fontWeight: "500" },
        bold: { fontFamily: "System", fontWeight: "600" },
        heavy: { fontFamily: "System", fontWeight: "700" },
    },
    default: {
        regular: { fontFamily: "sans-serif", fontWeight: "normal" },
        medium: { fontFamily: "sans-serif-medium", fontWeight: "normal" },
        bold: { fontFamily: "sans-serif", fontWeight: "600" },
        heavy: { fontFamily: "sans-serif", fontWeight: "700" },
    },
});

const base = {
    bodyBackground: "#FFFFFF",
    greenButton: "#A3AE95",
    darkText: "#3C4234",
    alertText: "#FF0000",
    lightColor: "#A3AE95",
    shadow: "#000000",
    switchact: "#F2EBBC",
    addbutton: "#D9E0CF",
    switchoff: "rgba(0,0,0,0.8)",
    switchthumb: "rgba(0,0,0,0.6)",
    placeholder: "rgba(0,0,0,0.4)",
    bottomBorder: "rgba(0,0,0,0.3)",

    overlayTopl: "rgba(163,174,149,0.6)",
    overlayTopd: "rgba(60,66,52,0.7)",
    overlayBig: "rgba(242,235,188,0.4)",
};

const semantic = {
    primary: base.greenButton,
    background: base.bodyBackground,
    card: "#FFFFFF",
    text: base.darkText,
    border: "rgba(0,0,0,0.12)",
    notification: base.alertText,

    success: "#2E7D32",
    warning: "#ED6C02",
    error: base.alertText,
    info: "#0288D1",
    mutedText: "#6B7280",
    inputBorder: base.bottomBorder,
    placeholder: base.placeholder,
};

const screenconstants = {
    cardwidth: 320,
    cardgap: 12
}

const spacing = {
    xxs: 4,
    xs: 8,
    sm: 12,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    xxxl: 40,
    textarea: 120
};

const radius = {
    sm: 6,
    md: 10,
    lg: 14,
    xl: 18,
    full: 999,
};

const sizes = {
    inputHeight: 50,
    buttonHeight: 42,
    icon: 24,
};

const elevation = {
    level1: 2,
    level2: 4,
    level3: 6,
    level4: 8,
    level5: 12,
};

const shadows = {
    level1: {
        shadowColor: base.shadow,
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: elevation.level2,
    },
    level2: {
        shadowColor: base.shadow,
        shadowOpacity: 0.2,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
        elevation: elevation.level3,
    },
    level3: {
        shadowColor: base.shadow,
        shadowOpacity: 0.25,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: elevation.level4,
    },
};

const opacities = {
    disabled: 0.6,
    pressed: 0.7,
    overlay: 0.9,
    fullscreen: 1
};

const blur = {
    screen: 0,
    modal: 20,
    light: 6,
};

const overlays = {
    toplight: base.overlayTopl,
    big: base.overlayBig,
    topdark: base.overlayTopd
};

const durations = {
    toast: 2000,
    short: 150,
    medium: 250,
    long: 400,
};

const regex = {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    password: /^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/,
};

const components = {
    Button: {
        height: sizes.buttonHeight,
        radius: radius.md,
        text: {
            size: 15,
            style: fonts.bold,
            color: semantic.text,
        },
        contained: {
            bg: base.greenButton,
            fg: semantic.text,
        },
        outlined: {
            bg: "transparent",
            fg: semantic.text,
            borderColor: "#000000",
            borderWidth: 1,
        },
        disabledOpacity: opacities.disabled,
    },

    Input: {
        height: sizes.inputHeight,
        fontSize: 16,
        paddingLeft: 15,
        borderBottomWidth: 1,
        borderBottomColor: semantic.inputBorder,
        placeholderColor: semantic.placeholder,
    },

    Modal: {
        card: {
            bg: base.lightColor,
            radius: radius.md,
            padding: spacing.md,
            ...shadows.level1,
        },
        bigCardHeight: 390,
        smallCardHeight: 250,
        overlayBg: "transparent",
        blurIntensity: blur.modal,
        innerOverlay: overlays.big,
    },

    Typography: {
        h1: { fontSize: 35, ...fonts.heavy, color: semantic.text },
        h2: { fontSize: 24, ...fonts.bold, color: semantic.text },
        body: { fontSize: 15, ...fonts.medium, color: semantic.text },
        small: { fontSize: 12, ...fonts.regular, color: semantic.text },
    },
};

export const AppTheme = {
    dark: false,
    colors: {
        primary: semantic.primary,
        background: semantic.background,
        card: semantic.card,
        text: semantic.text,
        border: semantic.border,
        notification: semantic.notification,
        success: semantic.success,
        warning: semantic.warning,
        error: semantic.error,
        info: semantic.info,
        placeholder: semantic.placeholder,
    },
    fonts,
};

export const tokens = {
    colors: { ...base, ...semantic },
    spacing,
    radius,
    sizes,
    elevation,
    shadows,
    opacities,
    blur,
    overlays,
    durations,
    regex,
    components,
    fonts,
    screenconstants
};

export const isValidEmail = (email) => tokens.regex.email.test(String(email || "").trim());
export const isValidPassword = (pwd) => tokens.regex.password.test(String(pwd || ""));

export const TOAST = {
    success: (text1 = "Smart Laundry", text2 = "Done") => ({
        type: "success",
        text1, text2,
        position: "top",
        visibilityTime: tokens.durations.toast,
        zIndex: 9999
    }),
    errorTop: (text1 = "Smart Laundry", text2 = "Something went wrong") => ({
        type: "error",
        text1, text2,
        position: "top",
        visibilityTime: tokens.durations.toast,
        zIndex: 9999
    }),
    errorBottom: (text1 = "Smart Laundry", text2 = "Something went wrong") => ({
        type: "error",
        text1, text2,
        position: "bottom",
        visibilityTime: tokens.durations.toast,
        zIndex: 9999
    }),
};
