const CHARS = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CHARS_LEN = CHARS.length;

export default (length = 8) => {
    let result = "";
    for (let i = length; i > 0; --i) {
        result += CHARS[Math.floor(Math.random() * CHARS_LEN)];
    }
    return result;
};
