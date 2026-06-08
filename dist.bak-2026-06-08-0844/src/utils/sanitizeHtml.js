"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeBlogHtml = sanitizeBlogHtml;
var ALLOWED_TAGS = new Set([
    'a',
    'blockquote',
    'br',
    'div',
    'em',
    'h2',
    'h3',
    'h4',
    'hr',
    'img',
    'li',
    'ol',
    'p',
    'span',
    'strong',
    'u',
    'ul',
]);
var ALLOWED_ATTRS = new Set(['alt', 'class', 'href', 'rel', 'src', 'target', 'title']);
function isSafeUrl(value) {
    var trimmed = value.trim().toLowerCase();
    return (trimmed.startsWith('/') ||
        trimmed.startsWith('http://') ||
        trimmed.startsWith('https://') ||
        trimmed.startsWith('mailto:'));
}
function sanitizeClassName(value) {
    return value
        .split(/\s+/)
        .filter(function (token) { return /^(blog-|cms-|attachment-|callout-|prose-|quote-)[a-z0-9_-]*$/i.test(token); })
        .join(' ');
}
function sanitizeWithDomParser(html) {
    var parser = new DOMParser();
    var doc = parser.parseFromString("<div>".concat(html, "</div>"), 'text/html');
    var root = doc.body.firstElementChild;
    if (!root)
        return '';
    var walk = function (node) {
        Array.from(node.childNodes).forEach(function (child) {
            if (child.nodeType === Node.COMMENT_NODE) {
                child.remove();
                return;
            }
            if (child.nodeType !== Node.ELEMENT_NODE)
                return;
            var element = child;
            var tag = element.tagName.toLowerCase();
            if (!ALLOWED_TAGS.has(tag)) {
                element.replaceWith.apply(element, Array.from(element.childNodes));
                return;
            }
            Array.from(element.attributes).forEach(function (attr) {
                var name = attr.name.toLowerCase();
                var value = attr.value;
                if (name.startsWith('on') || !ALLOWED_ATTRS.has(name)) {
                    element.removeAttribute(attr.name);
                    return;
                }
                if ((name === 'href' || name === 'src') && !isSafeUrl(value)) {
                    element.removeAttribute(attr.name);
                    return;
                }
                if (name === 'class') {
                    var safeClassName = sanitizeClassName(value);
                    if (safeClassName)
                        element.setAttribute('class', safeClassName);
                    else
                        element.removeAttribute('class');
                }
            });
            if (tag === 'a') {
                element.setAttribute('target', '_blank');
                element.setAttribute('rel', 'noopener noreferrer');
            }
            walk(element);
        });
    };
    walk(root);
    return root.innerHTML;
}
function sanitizeWithRegex(html) {
    return html
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<\s*(script|style|iframe|embed|object|form|input|button|textarea|select|meta|link)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
        .replace(/<\s*(script|style|iframe|embed|object|form|input|button|textarea|select|meta|link)[^>]*\/?\s*>/gi, '')
        .replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
        .replace(/\s+(href|src)\s*=\s*("|')\s*javascript:[\s\S]*?\2/gi, '')
        .replace(/\s+(href|src)\s*=\s*javascript:[^\s>]+/gi, '');
}
function sanitizeBlogHtml(html) {
    if (!html)
        return '';
    if (typeof DOMParser !== 'undefined') {
        return sanitizeWithDomParser(html);
    }
    return sanitizeWithRegex(html);
}
