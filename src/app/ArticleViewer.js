'use client';

import React, { useState } from 'react';

const ArticleViewer = () => {
    const [articles, setArticles] = useState([]);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [error, setError] = useState('');

    const parseArticles = (text) => {
        // Regular expression to detect article headers
        // Looks for patterns like:
        // Title: [title text]
        // Category: [category text]
        // Date: [date text]
        const headerRegex = /(.+?)\s*\n\s*(.+?)\s*\n\s*(.+?\d{2}:\d{2} [AP]M)/g;

        let articles = [];
        let match;
        let lastIndex = 0;

        // Find all header matches
        while ((match = headerRegex.exec(text)) !== null) {
            const startIndex = match.index;

            // If this isn't the first match, extract the content of the previous article
            if (lastIndex > 0) {
                const previousArticleEnd = text.substring(lastIndex, startIndex).trim();
                if (previousArticleEnd) {
                    articles[articles.length - 1].content = previousArticleEnd;
                }
            }

            // Add the new article
            articles.push({
                title: match[1].trim(),
                category: match[2].trim(),
                date: match[3].trim(),
                content: '',
                startIndex: startIndex
            });

            lastIndex = startIndex + match[0].length;
        }

        // Extract content for the last article
        if (articles.length > 0) {
            articles[articles.length - 1].content = text.substring(lastIndex).trim();
        }

        return articles;
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            setError('');
            setSelectedArticle(null);

            const text = await file.text();
            const parsedArticles = parseArticles(text);

            if (parsedArticles.length === 0) {
                setError('No articles found in the uploaded file. Make sure the file contains articles with the correct header format.');
            } else {
                setArticles(parsedArticles);
            }
        } catch (err) {
            setError('Error reading file: ' + err.message);
            setArticles([]);
        }
    };

    const viewArticle = (article) => {
        setSelectedArticle(article);
    };

    const goBackToList = () => {
        setSelectedArticle(null);
    };

    return (
        <div className="max-w-4xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Text Article Viewer</h1>

            <div className="mb-6">
                <label className="block text-sm font-medium mb-2">
                    Upload a text file:
                </label>
                <input
                    type="file"
                    accept=".txt"
                    onChange={handleFileUpload}
                    className="block w-full text-sm border border-gray-300 rounded p-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                    The file should contain articles with headers in the format:
                    <br />
                    &lt;Title&gt; (e.g., &ldquo;The world this week&rdquo;)
                    <br />
                    &lt;Category&gt; (e.g., &ldquo;Politics&rdquo;)
                    <br />
                    &lt;Date&gt; (e.g., &ldquo;Apr 25, 2025 02:10 AM&rdquo;)
                </p>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}

            {selectedArticle ? (
                <div className="bg-white border rounded-lg shadow-sm p-6">
                    <div className="flex justify-between items-center mb-4">
                        <button
                            onClick={goBackToList}
                            className="text-blue-600 hover:underline flex items-center"
                        >
                            &larr; Back to article list
                        </button>

                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(selectedArticle.content);
                                alert('Article copied to clipboard!');
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded flex items-center"
                        >
                            Copy to Clipboard
                        </button>
                    </div>

                    <div className="mb-4">
                        <h2 className="text-xl font-bold">{selectedArticle.title}</h2>
                        <div className="text-sm text-gray-600 mt-1">
                            {selectedArticle.category} | {selectedArticle.date}
                        </div>
                    </div>

                    <div className="whitespace-pre-wrap">
                        {selectedArticle.content}
                    </div>
                </div>
            ) : (
                <div>
                    {articles.length > 0 && (
                        <div>
                            <h2 className="text-xl font-bold mb-3">Articles Found: {articles.length}</h2>
                            <ul className="bg-white border rounded-lg divide-y">
                                {articles.map((article, index) => (
                                    <li key={index} className="p-4 hover:bg-gray-50">
                                        <button
                                            onClick={() => viewArticle(article)}
                                            className="w-full text-left"
                                        >
                                            <div className="font-medium text-blue-600 hover:underline">
                                                {article.title}
                                            </div>
                                            <div className="text-sm text-gray-600 mt-1">
                                                {article.category} | {article.date}
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ArticleViewer;