// Where a hand-curated post can come from. The admin form's dropdown and the "login needed" note on the
// cards both read this list, so they can never drift apart. Values are stored as the post's source label.
export const PLATFORMS = ["知乎", "X (Twitter)", "위챗 공식계정", "블로그", "뉴스레터", "기타"];

// Posts from these platforms usually cannot be opened without an account, so the card says so.
const LOGIN_REQUIRED = ["知乎", "X (Twitter)", "위챗 공식계정"];

export const needsLogin = (sourceLabel?: string) => !!sourceLabel && LOGIN_REQUIRED.includes(sourceLabel);
