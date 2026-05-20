"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseContentColumn = parseContentColumn;
exports.coerceHeroSlidesArray = coerceHeroSlidesArray;
exports.normalizeHeroContent = normalizeHeroContent;
exports.normalizeSectionContent = normalizeSectionContent;
function parseContentColumn(raw) {
    let parsed = raw;
    for (let depth = 0; depth < 4 && typeof parsed === 'string'; depth++) {
        const s = parsed.trim();
        if (!s)
            return null;
        try {
            parsed = JSON.parse(s);
        }
        catch {
            return null;
        }
    }
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? parsed
        : null;
}
function coerceHeroSlidesArray(raw) {
    let v = raw;
    for (let depth = 0; depth < 4 && typeof v === 'string'; depth++) {
        const s = v.trim();
        if (!s)
            return [];
        try {
            v = JSON.parse(s);
        }
        catch {
            return [];
        }
    }
    if (!Array.isArray(v))
        return [];
    return v
        .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
        .map((item) => ({ ...item }));
}
function normalizeHeroContent(content) {
    const slides = coerceHeroSlidesArray(content.slides);
    return { ...content, slides };
}
function normalizeSectionContent(sectionKey, content) {
    if (sectionKey === 'hero')
        return normalizeHeroContent(content);
    return content;
}
//# sourceMappingURL=contentNormalize.js.map