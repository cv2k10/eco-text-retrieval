'use client';

import React, { useState, useEffect } from 'react';

const ArticleViewer = () => {
    const [articles, setArticles] = useState([]);
    const [files, setFiles] = useState([]);
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch files on component mount
    useEffect(() => {
        fetchFiles();
    }, []);

    const fetchFiles = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/files');
            if (!response.ok) throw new Error('Failed to fetch files');
            const data = await response.json();
            setFiles(data);
            setLoading(false);
        } catch (error) {
            setError('Error fetching files: ' + error.message);
            setLoading(false);
        }
    };

    const fetchArticles = async (fileId) => {
        try {
            setLoading(true);
            const response = await fetch(`/api/articles?fileId=${fileId}`);
            if (!response.ok) throw new Error('Failed to fetch articles');
            const data = await response.json();
            setArticles(data);
            setSelectedArticle(null);
            setLoading(false);
        } catch (error) {
            setError('Error fetching articles: ' + error.message);
            setLoading(false);
        }
    };

    const searchArticles = async () => {
        if (!searchTerm.trim()) return;
        
        try {
            setLoading(true);
            const response = await fetch(`/api/articles?search=${encodeURIComponent(searchTerm)}`);
            if (!response.ok) throw new Error('Failed to search articles');
            const data = await response.json();
            setArticles(data);
            setSelectedArticle(null);
            setLoading(false);
        } catch (error) {
            setError('Error searching articles: ' + error.message);
            setLoading(false);
        }
    };

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
                let previousArticleContent = text.substring(lastIndex, startIndex).trim();

                // End article content if it encounters the '■' character
                const squareIndex = previousArticleContent.indexOf('■');
                if (squareIndex !== -1) {
                    previousArticleContent = previousArticleContent.substring(0, squareIndex).trim();
                }

                if (previousArticleContent) {
                    articles[articles.length - 1].content = previousArticleContent;
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
            let lastArticleContent = text.substring(lastIndex).trim();

            // End article content if it encounters the '■' character
            const squareIndex = lastArticleContent.indexOf('■');
            if (squareIndex !== -1) {
                lastArticleContent = lastArticleContent.substring(0, squareIndex).trim();
            }

            articles[articles.length - 1].content = lastArticleContent;
        }

        return articles;
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        try {
            setError('');
            setSelectedArticle(null);
            setLoading(true);

            const text = await file.text();
            const parsedArticles = parseArticles(text);

            if (parsedArticles.length === 0) {
                setError('No articles found in the uploaded file. Make sure the file contains articles with the correct header format.');
                setLoading(false);
                return;
            }
            
            // Save file and articles to database
            const response = await fetch('/api/files', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fileName: file.name,
                    fileContent: text,
                    articles: parsedArticles
                }),
            });
            
            if (!response.ok) {
                throw new Error('Failed to save file');
            }
            
            const result = await response.json();
            
            // Fetch updated files list
            await fetchFiles();
            
            // Fetch articles for the newly saved file
            await fetchArticles(result.fileId);
            
            setLoading(false);
        } catch (err) {
            setError('Error processing file: ' + err.message);
            setArticles([]);
            setLoading(false);
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
            
            {/* Add search functionality */}
            <div className="mb-6">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search articles..."
                        className="flex-1 p-2 border border-gray-300 rounded"
                        onKeyDown={(e) => e.key === 'Enter' && searchArticles()}
                    />
                    <button
                        onClick={searchArticles}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
                    >
                        Search
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    {error}
                </div>
            )}
            
            {loading && (
                <div className="text-center py-4">
                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    <p className="mt-2">Loading...</p>
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
                                navigator.clipboard.writeText(`${selectedArticle.title}\n\n${selectedArticle.content}`);
                                alert('Article copied to clipboard!');
                            }}
                            className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded flex items-center"
                        >
                            Copy to Clipboard
                        </button>

                        <button
                            onClick={() => {
                                const articleText = `${selectedArticle.title}\n\n${selectedArticle.content}`;
                                const encodedText = encodeURIComponent(articleText);
                                window.open(`https://chatgpt.com?q=${encodedText}`, '_blank');
                            }}
                            className="bg-green-600 hover:bg-green-700 text-white py-1 px-3 rounded flex items-center"
                        >
                            Send to ChatGPT
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
                    {/* Display saved files */}
                    {files.length > 0 && (
                        <div className="mb-6">
                            <h2 className="text-xl font-bold mb-3">Saved Files ({files.length})</h2>
                            <ul className="bg-white border rounded-lg divide-y">
                                {files.map((file) => (
                                    <li key={file.id} className="p-4 hover:bg-gray-50">
                                        <button
                                            onClick={() => fetchArticles(file.id)}
                                            className="w-full text-left"
                                        >
                                            <div className="font-medium text-blue-600 hover:underline">
                                                {file.name}
                                            </div>
                                            <div className="text-sm text-gray-600 mt-1">
                                                Uploaded: {new Date(file.created_at).toLocaleString()}
                                            </div>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                
                    {articles.length > 0 && (
                        <div>
                            <h2 className="text-xl font-bold mb-3">Articles Found: {articles.length}</h2>
                            <ul className="bg-white border rounded-lg divide-y">
                                {articles.map((article, index) => (
                                    <li key={article.id || index} className="p-4 hover:bg-gray-50">
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