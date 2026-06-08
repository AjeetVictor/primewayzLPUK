"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRelatedBlogPosts = exports.getBlogPostById = exports.getFeaturedBlogPost = exports.getAllBlogPosts = exports.blogPosts = void 0;
var posts_1 = require("./posts");
exports.blogPosts = posts_1.posts;
var getAllBlogPosts = function () { return exports.blogPosts; };
exports.getAllBlogPosts = getAllBlogPosts;
var getFeaturedBlogPost = function () { return exports.blogPosts.find(function (post) { return post.featured; }) || exports.blogPosts[0]; };
exports.getFeaturedBlogPost = getFeaturedBlogPost;
var getBlogPostById = function (id) {
    if (!id)
        return undefined;
    return exports.blogPosts.find(function (post) { return post.id === id || post.slug === id; });
};
exports.getBlogPostById = getBlogPostById;
var getRelatedBlogPosts = function (post, limit) {
    if (limit === void 0) { limit = 3; }
    var tagSet = new Set(post.tags);
    return exports.blogPosts
        .filter(function (candidate) { return candidate.id !== post.id; })
        .map(function (candidate) { return ({
        post: candidate,
        score: (candidate.category === post.category ? 2 : 0) +
            candidate.tags.filter(function (tag) { return tagSet.has(tag); }).length,
    }); })
        .sort(function (a, b) { return b.score - a.score; })
        .slice(0, limit)
        .map(function (item) { return item.post; });
};
exports.getRelatedBlogPosts = getRelatedBlogPosts;
