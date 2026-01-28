export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

export const validateUsername = (username) => {
    const re = /^[a-zA-Z0-9_]+$/;
    return re.test(username) && username.length >= 3 && username.length <= 30;
};

export const validatePassword = (password) => {
    return password.length >= 8;
};
